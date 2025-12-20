const MoreButton = ({ showWithDelay, cancelShow, hideWithDelay }) => {
  return (
    <div
      onMouseEnter={showWithDelay}
      onMouseLeave={() => {
        cancelShow();
        hideWithDelay();
      }}
    >
      <More id="more" color="#FFFFFF" />
    </div>
  );
};
export default MoreButton;
