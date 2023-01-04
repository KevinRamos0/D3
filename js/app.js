// Seleccionar elemento chart
const chart = d3.select("#chart");
const options = d3.select("#options");

//generar margenes automaticos
const margins = { top: 80, right: 20, bottom: 100, left: 150 };
const totalWith = +chart.style("width").slice(0, -2);
const totalHeigth = (totalWith * 9) / 16;
const chartWith = totalWith - margins.left - margins.right;
const chartHeigth = totalHeigth - margins.top - margins.bottom;

// crear dimensiones del chart
const svg = chart
  .append("svg")
  .attr("width", totalWith)
  .attr("height", totalHeigth)
  .attr("class", "graf");

// Agrupar elementos en el chart
const g = svg
  .append("g")
  .attr("transform", `translate(${margins.left}, ${margins.top})`);

// generar escaladores para los ejes
const x = d3.scaleBand().range([0, chartWith]);
// invertir y (por defecto está inverso)
const y = d3.scaleLinear().range([chartHeigth, 0]);

// // crear ejes del chart
const xAxis = g
  .append("g")
  .attr("transform", "translate(0," + chartHeigth + ")")
  .attr("class", "axis");

const yAxis = g.append("g").attr("class", "axis");

// por defecto filtrar los datos de este parametro
let parameter = "Agresión sexual con penetración";

// funcion que extrae los datos del dataset
const readData = async () => {
  const {
    Respuesta: {
      Datos: { Metricas: metrics },
    },
  } = await d3.json("data/las_cifras_del_crimen_en_españa.json", d3.autoType);
  // autoType asigna el tipo de dato segun el valor del campo
  // OJO: verificar el valor de los datos cuando (null, false)

  const data = metrics[0].Datos; // se obtiene unicamente el array de datos

  return data;
};

// cargar los datos y crear los dominios de las ejes
const loadData = async () => {
  const data = await readData(); // obtener los datos

  const newData = data.filter((d) => d.Parametro === parameter);

  x.domain(newData.map((d) => (d.Agno = `${d.Periodo} (${d.Agno})`))).padding(0.2);
  y.domain([0, d3.max(newData, (d) => d.Valor) * 1.1]);

  // efectos al actualizar el filtro
  xAxis.transition().duration(1000).call(d3.axisBottom(x));
  yAxis.transition().duration(1000).call(d3.axisLeft(y));

  g.append("text")
    .attr("x", chartWith / 2)
    .attr("y", -10)
    .attr("class", "labels")
    .attr("text-anchor", "middle")
    .text("Infracciones Penales por Trimestre");

  g.append("g")
    .attr("transform", `translate(-65, ${chartHeigth / 2})`)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .attr("class", "labels")
    .text("Unidades");

  render(newData);
};

// funcion que genera y actualiza la grafica según los datos obtenidos
const render = (data) => {
  const rect = g.selectAll("rect").data(data);

  rect
    .enter()
    .append("rect")
    .merge(rect)
    .transition()
    .duration(1000)
    .attr("x", (d) => x(d.Agno))
    .attr("y", (d) => y(d.Valor))
    .attr("width", x.bandwidth())
    .attr("height", (d) => chartHeigth - y(d.Valor))
    .attr("fill", "#ff002399");
};

// agrega los parametros obtenidos del dataset a elemento de seleccion
const optionsFilter = async () => {

  const data = await readData();

  const filters = new Set(data.map((d) => d.Parametro)); // solo valores unicos

  // Actualiza el dom del select para agregar los valores
  filters.forEach((sample) => {
    options.append("option").text(sample).property("value", sample);
  });
};

// aplica el filtro seleccionado para actualizar los datos
const optionChanged = (option) => {
  parameter = option;
  loadData();
};

optionsFilter();
loadData();