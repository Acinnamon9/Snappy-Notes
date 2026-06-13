import AddButton from "./AddButton";
import Color from "./Color";
import colors from "../assets/colors.json";

const Controls = () => {
    return (
        <aside id="controls" aria-label="Note controls">
            <AddButton />

            {colors.map((color) => (
                <Color key={color.id} color={color} />
            ))}
        </aside>
    );
};

export default Controls;