import "./style.css";

const app = document.querySelector("#app");

const button = document.createElement("button");
let count = 0;

const render = () => {
  button.textContent = `clicked ${count} time${count === 1 ? "" : "s"}`;
};

button.addEventListener("click", () => {
  count += 1;
  render();
});

render();
app.append(button);
