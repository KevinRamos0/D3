// Seleccionar elemento chart
const chart = d3.select("#pieChart");
const options = d3.select("#options");

//generar margenes automaticos
const margins = {
  top: 50,
  right: 20,
  bottom: 100,
  left: 150,
  end: 20,
};
// const totalWith = +chart.style("width").slice(0, -2);
const totalWith = 650;
const totalHeigthChart = (totalWith * 9) / (totalWith / 90);
const chartWith = totalWith - margins.left - margins.right;
const chartHeigth =
  totalHeigthChart - margins.top - margins.bottom - margins.end;

// crear dimensiones del chart
const svgPieChart = chart
  .append("svg")
  .attr("width", totalWith)
  .attr("height", totalHeigthChart)
  .attr("class", "graf")
  .append("g")
  .attr("transform", `translate(${margins.left}, ${margins.top})`);

// generar escaladores para los ejes
const x = d3.scaleBand().range([0, chartWith]);
// invertir y (por defecto está inverso)
const y = d3.scaleLinear().range([chartHeigth, 0]);

// // crear ejes del chart
const xAxis = svgPieChart
  .append("g")
  .attr("transform", "translate(0," + chartHeigth + ")")
  .attr("class", "axisX");

const yAxis = svgPieChart.append("g").attr("class", "axisY");

// por defecto filtrar los datos de este parametro
let parameter = "Agresión sexual con penetración";

// funcion que extrae los datos del dataset
const readDatachart = async () => {
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
  const data = await readDatachart(); // obtener los datos

  // filtrar unicamente los datos del parametro indiciado(filtro)
  const newData = data.filter((d) => d.Parametro === parameter);

  x.domain(newData.map((d) => (d.Agno = `${d.Periodo} (${d.Agno})`))).padding(
    0.2
  );
  y.domain([0, d3.max(newData, (d) => d.Valor) * 1.1]);

  // efectos al actualizar el filtro
  xAxis.transition().duration(1000).call(d3.axisBottom(x));
  yAxis.transition().duration(1000).call(d3.axisLeft(y));

  svgPieChart
    .append("text")
    .attr("x", chartWith / 2)
    .attr("y", -10)
    .attr("class", "labels")
    .attr("text-anchor", "middle")
    .text("Infracciones Penales por Trimestre");

  svgPieChart
    .append("g")
    .attr("transform", `translate(-80, ${chartHeigth / 2})`)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .attr("class", "labels")
    .text("Unidades");

  render(newData);
};

// funcion que genera y actualiza la grafica según los datos obtenidos
const render = (data) => {
  // mostrar detalles del dato
  const tooltip = chart
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip");

  const rect = svgPieChart.selectAll("rect").data(data);

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
    .attr("fill", "#ff000099");

  // ejecutar eventos la pasar el mouse por el elemento
  rect
    .on("mouseover", function (d, i) {
      tooltip
        .html(
          `Valor: ${i.Valor} <br /> Estado: ${i.Estado} <br /> Notas: ${i.Notas}`
        )
        .style("opacity", 1);
    })

    .on("mousemove", function (event, d) {
      tooltip
        .style("transform", `translateY(-600%)`)
        .style("margin-left", `${event.x - 10}px`);
    })

    .on("mouseout", function () {
      tooltip.html(``).style("opacity", 0);
    });
};

// agrega los parametros obtenidos del dataset a elemento de seleccion
const optionsFilter = async () => {
  const data = await readDatachart();

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