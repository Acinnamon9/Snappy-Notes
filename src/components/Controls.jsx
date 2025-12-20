import React, { useState, useRef } from "react";
import AddButton from "./AddButton";
import colors from "../assets/colors.json";
import Color from "./Color";
import More from "../icons/More";

const Controls = () => {
  const visibleColors = colors.slice(0, 3);
  const hiddenColors = colors.slice(3);

  const [expanded, setExpanded] = useState(false);

  const showTimer = useRef(null);
  const hideTimer = useRef(null);

  const showWithDelay = () => {
    clearTimeout(hideTimer.current);

    showTimer.current = setTimeout(() => {
      setExpanded(true);
    }, 400); // 👈 delay before opening
  };

  const cancelShow = () => {
    clearTimeout(showTimer.current);
  };

  const hideWithDelay = () => {
    clearTimeout(showTimer.current);

    hideTimer.current = setTimeout(() => {
      setExpanded(false);
    }, 2000);
  };

  return (
    <div id="controls">
      <AddButton />

      {visibleColors.map((color) => (
        <Color key={color.id} color={color} />
      ))}

      <div
        className={`controls-expanded ${expanded ? "open" : ""}`}
        onMouseEnter={() => clearTimeout(hideTimer.current)}
        onMouseLeave={hideWithDelay}
      >
        <div className="controls-expanded-inner">
          {hiddenColors.map((color) => (
            <Color key={color.id} color={color} />
          ))}
        </div>
      </div>

      <div
        onMouseEnter={showWithDelay}
        onMouseLeave={() => {
          cancelShow();
          hideWithDelay();
        }}
      >
        <More id="more" color="#FFFFFF" />
      </div>
    </div>
  );
};

export default Controls;
