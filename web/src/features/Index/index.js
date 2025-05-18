export const refreshBehavior = () => {
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
  
  window.addEventListener("load", function () {
    window.scrollTo(0, 0);
  });
};

export default refreshBehavior;