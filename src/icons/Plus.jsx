import PropTypes from "prop-types";

const Plus = ({ size = "24", color = "#FFFFFF" }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width={size}
            height={size}
            stroke={color}
            fill="none"
            strokeWidth="2.5"
        >
            <path
                strokeLinecap="round"
                d="M18 12H6M12 6v12"
            />
        </svg>
    );
};

Plus.propTypes = {
    size: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
    ]),
    color: PropTypes.string,
};

export default Plus;
