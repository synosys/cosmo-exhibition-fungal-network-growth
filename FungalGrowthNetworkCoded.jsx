import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import LogoTUD from "/logo/TUD_Logo_weiss_57.png";
import LogoSynoSys from "/logo/SynoSys_Logo_Lok_weiss.png";
import LogoCIDS from "/logo/Logo_CIDS_short_white.png";
import LogoJYU from "/logo/JYU_logo.png";

const FungusGraph = () => {
  const svgRef = useRef(null);

  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [title, setTitle] = useState();

  const [customColors, setCustomColors] = useState([
    "#352A87", 
    "#197EC0",
    "#22A784",
    "#FDE333",
    "#FD9A14",
  ]);

  const [backgroundColor, setBackgroundColor] = useState("#0e0e0e");
  const [centerColor, setCenterColor] = useState("#000000");

  const [language, setLanguage] = useState("EN");
  const [edgeMetric, setEdgeMetric] = useState("width");

  const [isSmallScreen, setIsSmallScreen] = useState(false);

  const texts = {
    EN: {
      mainTitle: "Fungus Absidia",
      subtitle: "A snapshot of fungal network complexity",
      description:
        "Explore this static visualization of Fungus Absidia. Each link represents how the fungus organizes its growth at a given point in time. Use the controls below to customize the appearance:",
      networkLabel: "Network Colors",
      backgroundLabel: "Background",
      hubLabel: "Central Hub",
      branchThickness: "Branch Thickness (Width)",
      connectionIntensity: "Connection Intensity (Weight)",
      branchExtension: "Branch Extension (Length)",
      biomassCapacity: "Biomass Capacity (Volume)",
      edgeSpan: "Edge Span (Euclidean Distance)",
    },
    DE: {
      mainTitle: "Fungus Absidia",
      subtitle: "Ein Schnappschuss der Komplexität des Pilznetzwerks",
      description:
        "Erkunden Sie diese statische Visualisierung von Fungus Absidia. Jede Verbindung zeigt, wie der Pilz sein Wachstum zu einem bestimmten Zeitpunkt organisiert. Verwenden Sie die unten stehenden Steuerelemente, um das Erscheinungsbild anzupassen:",
      networkLabel: "Netzwerkfarben",
      backgroundLabel: "Hintergrund",
      hubLabel: "Zentrales Element",
      branchThickness: "Astdicke (Breite)",
      connectionIntensity: "Verbindungsintensität (Gewicht)",
      branchExtension: "Astlänge (Länge)",
      biomassCapacity: "Biomassekapazität (Volumen)",
      edgeSpan: "Kantenreichweite (e_distance)",
    },
  };

  useEffect(() => {
    function handleResize() {
      setIsSmallScreen(window.innerWidth < 768);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const edgesPromise = d3.csv("/edges.csv", (d) => ({
      from: +d.from,
      to: +d.to,
      name: d.name,
      edge_id: +d.edge_id,
      weight: +d.weight,
      length: +d.length,
      width: +d.width,
      volume: +d.Volume,
      type: d.type,
      e_distance: +d.e_distance,
      in_mst: d.in_mst === "TRUE",
    }));

    const verticesPromise = d3.csv("/vertices.csv", (d) => ({
      degrees: +d.Degrees,
      accessibility: +d.Accessibility,
      node_ID: +d.node_ID,
    }));

    const spatialPromise = d3.csv("/spatial.csv", (d) => ({
      x: +d.node_X_pix,
      y: +d.node_Y_pix,
    }));

    Promise.all([edgesPromise, verticesPromise, spatialPromise])
      .then(([edgesData, verticesData, spatialData]) => {
        const fungusName = edgesData.length > 0 ? edgesData[0].name : "";
        const mergedNodes = verticesData.map((v, i) => ({
          id: v.node_ID,
          degrees: v.degrees,
          accessibility: v.accessibility,
          x: spatialData[i]?.x ?? 0,
          y: spatialData[i]?.y ?? 0,
        }));
        const mergedLinks = edgesData.map((e) => ({
          source: e.from,
          target: e.to,
          width: e.width,
          weight: e.weight,
          length: e.length,
          volume: e.volume,
          e_distance: e.e_distance,
          type: e.type,
          in_mst: e.in_mst,
        }));

        setNodes(mergedNodes);
        setLinks(mergedLinks);
        setTitle(fungusName);
      })
      .catch((error) => {
        console.error("Error loading CSV files:", error);
      });
  }, []);

  useEffect(() => {
    if (!nodes.length || !links.length) return;
    const svgEl = d3.select(svgRef.current);
    svgEl.selectAll("*").remove();

    const width = window.innerWidth - 300;
    const height = window.innerHeight;

    const svg = svgEl
      .attr("width", width)
      .attr("height", height)
      .style("background", backgroundColor);

    const container = svg
      .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const zoomBehavior = d3
      .zoom()
      .scaleExtent([0.5, 5])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });
    svg.call(zoomBehavior);

    container
      .append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 10)
      .attr("fill", centerColor);

    const colorInterpolator = d3.interpolateRgbBasis(customColors);

    const metricValues = links.map((d) => d[edgeMetric]);
    const minMetric = d3.min(metricValues);
    const maxMetric = d3.max(metricValues);
    const metricScale = d3
      .scaleLinear()
      .domain([minMetric, maxMetric])
      .range([0, 1]);

    container
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("x1", (d) => {
        const node = nodes.find((n) => n.id === d.source);
        return node ? node.x * 400 : 0;
      })
      .attr("y1", (d) => {
        const node = nodes.find((n) => n.id === d.source);
        return node ? node.y * 400 : 0;
      })
      .attr("x2", (d) => {
        const node = nodes.find((n) => n.id === d.target);
        return node ? node.x * 400 : 0;
      })
      .attr("y2", (d) => {
        const node = nodes.find((n) => n.id === d.target);
        return node ? node.y * 400 : 0;
      })
      .attr("stroke-width", (d) => (d.type === "Inoculum" ? 0 : 2))
      .attr("stroke", (d) =>
        d.type === "Inoculum"
          ? "#000000"
          : colorInterpolator(metricScale(d[edgeMetric]))
      );
  }, [
    nodes,
    links,
    title,
    customColors,
    backgroundColor,
    centerColor,
    edgeMetric,
  ]);

  const handleColorChange = (index, value) => {
    setCustomColors((prevColors) => {
      const newColors = [...prevColors];
      newColors[index] = value;
      return newColors;
    });
  };

  const handleBackgroundColorChange = (value) => {
    setBackgroundColor(value);
  };

  const handleCenterColorChange = (value) => {
    setCenterColor(value);
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
  };

  const containerStyle = {
    display: "flex",
    flexDirection: isSmallScreen ? "column" : "row",
    height: "100vh",
    background: backgroundColor,
    fontFamily: "'Playfair Display', Georgia, serif",
    color: "#fff",
  };

  const controlPanelStyle = {
    position: "relative",
    width: isSmallScreen ? "100%" : "450px",
    padding: "20px",
    background: "transparent",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  };

  const svgContainerStyle = {
    flexGrow: 1,
    overflow: "hidden",
    height: isSmallScreen ? "50vh" : "auto",
  };

  const borderDivStyle = {
    position: "absolute",
    top: 0,
    right: "-10px",
    width: "1px",
    height: "100%",
    background: "#fff",
  };

  const titleWrapperStyle = {
    textAlign: "left",
    marginBottom: "20px",
  };

  const mainTitleStyle = {
    fontSize: "3em",
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: "5px",
    lineHeight: "1",
  };

  const titleUnderlineStyle = {
    width: "100%",
    height: "2px",
    background: "#fff",
    margin: "0 auto 10px auto",
  };

  const subtitleStyle = {
    fontSize: "1.1em",
    fontStyle: "italic",
    color: "#fff",
  };

  const descriptionStyle = {
    fontSize: "0.9em",
    lineHeight: "1.4em",
    color: "#fff",
    marginBottom: "15px",
    textAlign: "left",
  };

  const labelStyle = {
    marginRight: "10px",
    width: isSmallScreen ? "100%" : "380px",
    color: "#fff",
    textAlign: "left",
  };

  const inputStyle = {
    border: "1px solid #fff",
    background: "transparent",
    width: "40px",
    height: "40px",
    cursor: "pointer",
  };

  const langToggleStyle = {
    display: "flex",
    justifyContent: "left",
  };

  return (
    <div style={containerStyle}>
      <div style={controlPanelStyle}>
        <div style={titleWrapperStyle}>
          <div style={mainTitleStyle}>{texts[language].mainTitle}</div>
          <div style={titleUnderlineStyle}></div>
          <div style={subtitleStyle}>{texts[language].subtitle}</div>
        </div>
        <div style={descriptionStyle}>{texts[language].description}</div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <label style={labelStyle}>{texts[language].backgroundLabel}:</label>
          <input
            type="color"
            value={backgroundColor}
            onChange={(e) => handleBackgroundColorChange(e.target.value)}
            style={inputStyle}
          />
        </div>
        {[
          { label: texts[language].branchThickness, color: customColors[0] },
          {
            label: texts[language].connectionIntensity,
            color: customColors[1],
          },
          { label: texts[language].branchExtension, color: customColors[2] },
          { label: texts[language].biomassCapacity, color: customColors[3] },
          { label: texts[language].edgeSpan, color: customColors[4] },
        ].map((item, index) => (
          <div key={index} style={{ display: "flex", alignItems: "center" }}>
            <label style={labelStyle}>{item.label}:</label>
            <input
              type="color"
              value={item.color}
              onChange={(e) => handleColorChange(index, e.target.value)}
              style={inputStyle}
            />
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center" }}>
          <label style={labelStyle}>{texts[language].hubLabel}:</label>
          <input
            type="color"
            value={centerColor}
            onChange={(e) => handleCenterColorChange(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <label style={labelStyle}>{texts[language].networkLabel}:</label>
          <select
            value={edgeMetric}
            onChange={(e) => setEdgeMetric(e.target.value)}
            style={{ padding: "5px", cursor: "pointer" }}
          >
            <option value="width">{texts[language].branchThickness}</option>
            <option value="weight">
              {texts[language].connectionIntensity}
            </option>
            <option value="length">{texts[language].branchExtension}</option>
            <option value="volume">{texts[language].biomassCapacity}</option>
            <option value="e_distance">{texts[language].edgeSpan}</option>
          </select>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "120px",
            textAlign: "left",
          }}
        >
          <p>
            Researchers: Dr. Carlos A. Aguilar-Trigueros, Dr. Pascal Klamser
          </p>
          <br />
          <p>Data Visualization by Isin Kosemen</p>
        </div>
        <div style={langToggleStyle}>
          <span
            onClick={() => handleLanguageChange("EN")}
            style={{
              cursor: "pointer",
              color: language === "EN" ? "red" : "#fff",
              marginRight: "10px",
            }}
          >
            EN
          </span>
          <span
            onClick={() => handleLanguageChange("DE")}
            style={{
              cursor: "pointer",
              color: language === "DE" ? "red" : "#fff",
            }}
          >
            DE
          </span>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            transform: "translateX(-60%)",
            left: "40%",
            display: "flex",
            gap: "2px",
            alignItems: "center",
          }}
        >
          <img
            src={LogoTUD}
            alt="Logo"
            style={{ width: "70px" }}
          />
          <img
            src={LogoSynoSys}
            alt="Logo"
            style={{ width: "120px" }}
          />
          <img
            src={LogoCIDS}
            alt="Logo"
            style={{ width: "55px" }}
          />
         <img
            src={LogoJYU}
            alt="Logo"
            className="w-[80px] bg-white p-[1px] ml-5 rounded shadow"
          />
        </div>
      </div>
      <div style={svgContainerStyle}>
        <svg ref={svgRef} />
      </div>
    </div>
  );
};

export default FungusGraph;
