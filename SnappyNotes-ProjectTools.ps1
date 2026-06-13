Set-StrictMode -Version Latest

# -----------------------------
# Project context helper tools
# -----------------------------

function Get-ProjectToolRoot {
    [CmdletBinding()]
    param()

    $git = Get-Command git -ErrorAction SilentlyContinue

    if ($git) {
        $gitRoot = & git rev-parse --show-toplevel 2>$null

        if ($LASTEXITCODE -eq 0 -and $gitRoot) {
            return [System.IO.Path]::GetFullPath(($gitRoot | Select-Object -First 1))
        }
    }

    return (Get-Location).Path
}

function Get-ProjectToolRelativePath {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string] $BasePath,

        [Parameter(Mandatory)]
        [string] $FullPath
    )

    $base = [System.IO.Path]::GetFullPath($BasePath).TrimEnd('\', '/')
    $full = [System.IO.Path]::GetFullPath($FullPath)

    if ($full.StartsWith($base, [System.StringComparison]::OrdinalIgnoreCase)) {
        return $full.Substring($base.Length).TrimStart('\', '/').Replace('\', '/')
    }

    return $full.Replace('\', '/')
}

function Get-ProjectToolIgnorePatterns {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string] $Root
    )

    $patterns = @(
        '.git'
        '.git/*'
        'node_modules'
        'node_modules/*'
        'dist'
        'dist/*'
        'build'
        'build/*'
        'coverage'
        'coverage/*'
        '.next'
        '.next/*'
        '.turbo'
        '.turbo/*'
        '.vite'
        '.vite/*'
        '.cache'
        '.cache/*'
        '*.lock'
        '*.map'
        '*.min.js'
        '*.min.css'
        '.env'
        '.env.*'
        '*.pem'
        '*.key'
        '*.pfx'
        '*.p12'
        'project-map.txt'
        'project-files.txt'
        'project-find.txt'
        'project-changes.txt'
    )

    $ignoreFile = Join-Path $Root '.aiignore'

    if (Test-Path -LiteralPath $ignoreFile -PathType Leaf) {
        $customPatterns = Get-Content -LiteralPath $ignoreFile |
            ForEach-Object { $_.Trim() } |
            Where-Object {
                $_ -and
                -not $_.StartsWith('#') -and
                -not $_.StartsWith('!')
            }

        $patterns += $customPatterns
    }

    return $patterns | Select-Object -Unique
}

function Test-ProjectToolIgnored {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string] $RelativePath,

        [Parameter(Mandatory)]
        [string[]] $Patterns
    )

    $path = $RelativePath.Replace('\', '/').TrimStart('/')

    # Keep safe environment templates available, while excluding actual secret files.
    if ($path -match '(^|/)\.env\.(example|sample|template)$') {
        return $false
    }

    foreach ($rawPattern in $Patterns) {
        $pattern = $rawPattern.Trim().Replace('\', '/').TrimStart('/')

        if (-not $pattern) {
            continue
        }

        if ($path -like $pattern) {
            return $true
        }

        if ($path -like "$pattern/*") {
            return $true
        }

        if ($pattern -notlike '*/*' -and $path -like "*/$pattern") {
            return $true
        }

        if ($pattern -notlike '*/*' -and $path -like "*/$pattern/*") {
            return $true
        }
    }

    return $false
}

function Test-ProjectToolTextFile {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [System.IO.FileInfo] $File,

        [int64] $MaxBytes = 1048576
    )

    if ($File.Length -gt $MaxBytes) {
        return $false
    }

    $binaryExtensions = @(
        '.7z', '.avi', '.bmp', '.class', '.db', '.dll', '.doc', '.docx',
        '.eot', '.exe', '.gif', '.gz', '.ico', '.jar', '.jpeg', '.jpg',
        '.lockb', '.mov', '.mp3', '.mp4', '.otf', '.pdf', '.png', '.ppt',
        '.pptx', '.pyc', '.rar', '.sqlite', '.tar', '.tif', '.tiff', '.ttf',
        '.wav', '.webm', '.webp', '.woff', '.woff2', '.xls', '.xlsx', '.zip'
    )

    if ($binaryExtensions -contains $File.Extension.ToLowerInvariant()) {
        return $false
    }

    try {
        $stream = [System.IO.File]::OpenRead($File.FullName)

        try {
            $bufferSize = [Math]::Min(4096, [int]$stream.Length)
            $buffer = New-Object byte[] $bufferSize
            $read = $stream.Read($buffer, 0, $bufferSize)

            for ($index = 0; $index -lt $read; $index++) {
                if ($buffer[$index] -eq 0) {
                    return $false
                }
            }
        }
        finally {
            $stream.Dispose()
        }
    }
    catch {
        return $false
    }

    return $true
}

function Get-ProjectToolCandidateFiles {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string] $Root,

        [Parameter(Mandatory)]
        [string[]] $Patterns,

        [string[]] $StartPaths
    )

    $files = New-Object System.Collections.Generic.List[System.IO.FileInfo]
    $directories = New-Object System.Collections.Generic.Stack[string]

    if (-not $StartPaths -or $StartPaths.Count -eq 0) {
        $directories.Push($Root)
    }
    else {
        foreach ($startPath in $StartPaths) {
            $resolvedInput = $startPath

            if (-not [System.IO.Path]::IsPathRooted($resolvedInput)) {
                $resolvedInput = Join-Path $Root $resolvedInput
            }

            $matches = @(Get-Item -Path $resolvedInput -Force -ErrorAction SilentlyContinue)

            if ($matches.Count -eq 0) {
                Write-Warning "Path not found: $startPath"
                continue
            }

            foreach ($match in $matches) {
                if ($match.PSIsContainer) {
                    $relativeDirectory = Get-ProjectToolRelativePath -BasePath $Root -FullPath $match.FullName

                    if (-not (Test-ProjectToolIgnored -RelativePath $relativeDirectory -Patterns $Patterns)) {
                        $directories.Push($match.FullName)
                    }
                }
                else {
                    $relativeFile = Get-ProjectToolRelativePath -BasePath $Root -FullPath $match.FullName

                    if (-not (Test-ProjectToolIgnored -RelativePath $relativeFile -Patterns $Patterns)) {
                        $files.Add([System.IO.FileInfo]$match)
                    }
                }
            }
        }
    }

    while ($directories.Count -gt 0) {
        $currentDirectory = $directories.Pop()
        $children = @(Get-ChildItem -LiteralPath $currentDirectory -Force -ErrorAction SilentlyContinue)

        foreach ($child in $children) {
            $relative = Get-ProjectToolRelativePath -BasePath $Root -FullPath $child.FullName

            if (Test-ProjectToolIgnored -RelativePath $relative -Patterns $Patterns) {
                continue
            }

            if ($child.PSIsContainer) {
                $directories.Push($child.FullName)
            }
            else {
                $files.Add([System.IO.FileInfo]$child)
            }
        }
    }

    return $files | Sort-Object FullName -Unique
}

function Get-ProjectToolFiles {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string] $Root,

        [string[]] $InputPaths,

        [int64] $MaxBytes = 1048576
    )

    $ignorePatterns = Get-ProjectToolIgnorePatterns -Root $Root

    return Get-ProjectToolCandidateFiles `
        -Root $Root `
        -Patterns $ignorePatterns `
        -StartPaths $InputPaths |
        Where-Object {
            Test-ProjectToolTextFile -File $_ -MaxBytes $MaxBytes
        }
}

function Write-ProjectToolOutput {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string[]] $Lines,

        [Parameter(Mandatory)]
        [string] $OutputPath
    )

    $parent = Split-Path -Parent $OutputPath

    if ($parent -and -not (Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }

    $Lines | Set-Content -LiteralPath $OutputPath -Encoding UTF8
    Write-Host "Created: $OutputPath"
}

function project-map {
    [CmdletBinding()]
    param(
        [string] $Output = 'project-map.txt',

        [int] $MaxDepth = 12
    )

    $root = Get-ProjectToolRoot

    if (-not [System.IO.Path]::IsPathRooted($Output)) {
        $Output = Join-Path $root $Output
    }

    $ignorePatterns = Get-ProjectToolIgnorePatterns -Root $root
    $lines = New-Object System.Collections.Generic.List[string]

    $lines.Add('# Project Map')
    $lines.Add('')
    $lines.Add("Root: $root")
    $lines.Add("Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
    $lines.Add('')

    $git = Get-Command git -ErrorAction SilentlyContinue

    if ($git) {
        $branch = & git -C $root branch --show-current 2>$null
        $commit = & git -C $root log -1 --pretty=format:'%h %s (%ad)' --date=short 2>$null

        if ($branch) {
            $lines.Add("Git branch: $branch")
        }

        if ($commit) {
            $lines.Add("Latest commit: $commit")
        }

        $status = & git -C $root status --short 2>$null

        if ($status) {
            $lines.Add('')
            $lines.Add('## Git status')
            $lines.Add('')
            foreach ($statusLine in $status) {
                $lines.Add($statusLine)
            }
        }
    }

    $lines.Add('')
    $lines.Add('## Structure')
    $lines.Add('')

    $mapFiles = @(Get-ProjectToolCandidateFiles -Root $root -Patterns $ignorePatterns)
    $entries = New-Object System.Collections.Generic.HashSet[string]

    foreach ($file in $mapFiles) {
        $relative = Get-ProjectToolRelativePath -BasePath $root -FullPath $file.FullName
        $parts = $relative -split '/'

        if ($parts.Count -gt $MaxDepth) {
            continue
        }

        for ($index = 1; $index -lt $parts.Count; $index++) {
            $directoryPath = ($parts[0..($index - 1)] -join '/') + '/'
            [void]$entries.Add($directoryPath)
        }

        [void]$entries.Add($relative)
    }

    foreach ($entry in ($entries | Sort-Object)) {
        $displayPath = $entry.TrimEnd('/')
        $parts = $displayPath -split '/'
        $depth = $parts.Count - 1
        $indent = '  ' * $depth
        $name = $parts[-1]

        if ($entry.EndsWith('/')) {
            $lines.Add("$indent- $name/")
        }
        else {
            $lines.Add("$indent- $name")
        }
    }

    $packageJsonPath = Join-Path $root 'package.json'

    if (Test-Path -LiteralPath $packageJsonPath -PathType Leaf) {
        try {
            $package = Get-Content -LiteralPath $packageJsonPath -Raw | ConvertFrom-Json
            $lines.Add('')
            $lines.Add('## package.json summary')
            $lines.Add('')

            $nameProperty = $package.PSObject.Properties['name']
            $scriptsProperty = $package.PSObject.Properties['scripts']
            $dependenciesProperty = $package.PSObject.Properties['dependencies']
            $devDependenciesProperty = $package.PSObject.Properties['devDependencies']

            if ($nameProperty -and $nameProperty.Value) {
                $lines.Add("Name: $($nameProperty.Value)")
            }

            if ($scriptsProperty -and $scriptsProperty.Value) {
                $lines.Add('')
                $lines.Add('Scripts:')

                foreach ($property in $scriptsProperty.Value.PSObject.Properties) {
                    $lines.Add("  $($property.Name): $($property.Value)")
                }
            }

            $dependencyNames = @()

            if ($dependenciesProperty -and $dependenciesProperty.Value) {
                $dependencyNames += $dependenciesProperty.Value.PSObject.Properties.Name
            }

            if ($devDependenciesProperty -and $devDependenciesProperty.Value) {
                $dependencyNames += $devDependenciesProperty.Value.PSObject.Properties.Name
            }

            if ($dependencyNames.Count -gt 0) {
                $lines.Add('')
                $lines.Add('Dependencies:')
                foreach ($dependencyName in ($dependencyNames | Sort-Object -Unique)) {
                    $lines.Add("  - $dependencyName")
                }
            }
        }
        catch {
            $lines.Add('')
            $lines.Add("Could not parse package.json: $($_.Exception.Message)")
        }
    }

    Write-ProjectToolOutput -Lines $lines.ToArray() -OutputPath $Output
}

function project-files {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory, Position = 0, ValueFromRemainingArguments)]
        [string[]] $Path,

        [string] $Output = 'project-files.txt',

        [int] $MaxFileSizeKB = 1024
    )

    $root = Get-ProjectToolRoot

    if (-not [System.IO.Path]::IsPathRooted($Output)) {
        $Output = Join-Path $root $Output
    }

    $files = Get-ProjectToolFiles `
        -Root $root `
        -InputPaths $Path `
        -MaxBytes ($MaxFileSizeKB * 1KB)

    $lines = New-Object System.Collections.Generic.List[string]

    $lines.Add('# Selected Project Files')
    $lines.Add('')
    $lines.Add("Root: $root")
    $lines.Add("Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
    $lines.Add('')

    if (-not $files) {
        $lines.Add('No readable text files matched.')
    }

    foreach ($file in $files) {
        $relative = Get-ProjectToolRelativePath -BasePath $root -FullPath $file.FullName

        $lines.Add('')
        $lines.Add(('=' * 88))
        $lines.Add("FILE: $relative")
        $lines.Add(('=' * 88))

        try {
            $fileLines = @(Get-Content -LiteralPath $file.FullName -ErrorAction Stop)
            $width = [Math]::Max(4, $fileLines.Count.ToString().Length)

            for ($index = 0; $index -lt $fileLines.Count; $index++) {
                $lineNumber = ($index + 1).ToString().PadLeft($width, ' ')
                $lines.Add("$lineNumber | $($fileLines[$index])")
            }

            if ($fileLines.Count -eq 0) {
                $lines.Add('[empty file]')
            }
        }
        catch {
            $lines.Add("[could not read file: $($_.Exception.Message)]")
        }
    }

    Write-ProjectToolOutput -Lines $lines.ToArray() -OutputPath $Output
}

function project-find {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory, Position = 0, ValueFromRemainingArguments)]
        [string[]] $Pattern,

        [string] $Output = 'project-find.txt',

        [int] $MaxFileSizeKB = 1024,

        [switch] $CaseSensitive
    )

    $root = Get-ProjectToolRoot

    if (-not [System.IO.Path]::IsPathRooted($Output)) {
        $Output = Join-Path $root $Output
    }

    $files = Get-ProjectToolFiles `
        -Root $root `
        -MaxBytes ($MaxFileSizeKB * 1KB)

    $lines = New-Object System.Collections.Generic.List[string]

    $lines.Add('# Project Search')
    $lines.Add('')
    $lines.Add("Root: $root")
    $lines.Add("Patterns: $($Pattern -join ', ')")
    $lines.Add("Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
    $lines.Add('')

    $matchCount = 0

    foreach ($searchPattern in $Pattern) {
        $lines.Add("## Pattern: $searchPattern")
        $lines.Add('')

        foreach ($file in $files) {
            $selectParams = @{
                LiteralPath = $file.FullName
                Pattern     = $searchPattern
                SimpleMatch = $true
                ErrorAction = 'SilentlyContinue'
            }

            if ($CaseSensitive) {
                $selectParams.CaseSensitive = $true
            }

            $matches = Select-String @selectParams

            foreach ($match in $matches) {
                $relative = Get-ProjectToolRelativePath -BasePath $root -FullPath $file.FullName
                $lines.Add("$relative`:$($match.LineNumber): $($match.Line.Trim())")
                $matchCount++
            }
        }

        $lines.Add('')
    }

    if ($matchCount -eq 0) {
        $lines.Add('No matches found.')
    }
    else {
        $lines.Add("Total matches: $matchCount")
    }

    Write-ProjectToolOutput -Lines $lines.ToArray() -OutputPath $Output
}

function project-changes {
    [CmdletBinding()]
    param(
        [string] $Output = 'project-changes.txt',

        [int] $ContextLines = 3,

        [int] $MaxSectionLines = 5000
    )

    $root = Get-ProjectToolRoot

    if (-not [System.IO.Path]::IsPathRooted($Output)) {
        $Output = Join-Path $root $Output
    }

    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        throw 'Git was not found in PATH.'
    }

    & git -C $root rev-parse --is-inside-work-tree *> $null

    if ($LASTEXITCODE -ne 0) {
        throw "Not inside a Git repository: $root"
    }

    $lines = New-Object System.Collections.Generic.List[string]

    $lines.Add('# Project Changes')
    $lines.Add('')
    $lines.Add("Root: $root")
    $lines.Add("Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
    $lines.Add('')

    $sections = @(
        @{
            Title = 'Branch'
            Args  = @('branch', '--show-current')
        }
        @{
            Title = 'Latest commit'
            Args  = @('log', '-1', '--pretty=format:%h %s (%ad)', '--date=short')
        }
        @{
            Title = 'Status'
            Args  = @('status', '--short')
        }
        @{
            Title = 'Changed-file summary'
            Args  = @('diff', '--stat')
        }
        @{
            Title = 'Unstaged diff'
            Args  = @('diff', '--no-ext-diff', "--unified=$ContextLines", '--', '.')
        }
        @{
            Title = 'Staged diff'
            Args  = @('diff', '--cached', '--no-ext-diff', "--unified=$ContextLines", '--', '.')
        }
        @{
            Title = 'Untracked files'
            Args  = @('ls-files', '--others', '--exclude-standard')
        }
    )

    foreach ($section in $sections) {
        $lines.Add("## $($section.Title)")
        $lines.Add('')

        $gitArguments = @('-C', $root) + @($section.Args)
        $result = @(& git @gitArguments 2>&1)

        if ($result.Count -gt 0) {
            $visibleResult = @($result | Select-Object -First $MaxSectionLines)

            foreach ($resultLine in $visibleResult) {
                $lines.Add([string]$resultLine)
            }

            if ($result.Count -gt $MaxSectionLines) {
                $omittedCount = $result.Count - $MaxSectionLines
                $lines.Add('')
                $lines.Add("[truncated: $omittedCount additional lines omitted]")
            }
        }
        else {
            $lines.Add('[none]')
        }

        $lines.Add('')
    }

    Write-ProjectToolOutput -Lines $lines.ToArray() -OutputPath $Output
}
