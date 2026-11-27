// aplica visual e tema antes do primeiro desenho para não piscar
try {
  var def = "cakto";
  var sk = JSON.parse(localStorage.getItem("vq.skin") || "null");
  var th = JSON.parse(localStorage.getItem("vq.theme") || "null");
  document.documentElement.setAttribute("data-skin", sk || def);
  if (th) document.documentElement.setAttribute("data-theme", th);
} catch (e) {
  document.documentElement.setAttribute("data-skin", "cakto");
}
