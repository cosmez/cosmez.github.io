// Gráficas del post "Jev en Español". Datos: data/grounding.js (window.DATOS_GROUNDING)
// { variants: [...], questions: [{id, cat, q}], items: [{q, y, n: [ts, codiv, laya], d, t}] }
(function () {
    "use strict";
    const C = window.Charts;
    const el = C.el;

    const CATS = {
        estado: "Estados", dependencia: "Dependencias", programa: "Programas",
        persona: "Personas", pais: "Países", tiempo: "Tiempo", cifra: "Cifras",
        palabra: "Palabras", forma: "Forma del texto",
    };

    try {
        const data = C.data("DATOS_GROUNDING");
        const V = data.variants;
        umbral(document.getElementById("grafica-umbral"), data, V);
        distribucion(document.getElementById("grafica-distribucion"), data, V);
        explorador(document.getElementById("explorador"), data, V);
    } catch (err) {
        for (const id of ["grafica-umbral", "grafica-distribucion", "explorador"]) {
            const box = document.getElementById(id);
            if (box) C.fail(box.querySelector(".chart-body"), err);
        }
    }

    function exactitud(items, i, t) {
        let ok = 0, fn = 0, fp = 0;
        for (const it of items) {
            const si = it.n[i] >= t;
            if (si === (it.y === 1)) ok++;
            else if (it.y === 1) fn++;
            else fp++;
        }
        return { acc: ok / items.length, fn, fp };
    }

    // 1. Exactitud contra umbral, con slider.
    function umbral(box, data, V) {
        if (!box) return;
        const body = box.querySelector(".chart-body");
        const items = data.items;
        const curva = [];
        const mejor = {};
        V.forEach((v, i) => {
            mejor[v] = { t: 0.5, acc: 0 };
            for (let k = 1; k <= 99; k++) {
                const t = k / 100;
                const { acc } = exactitud(items, i, t);
                curva.push({ v, t, acc });
                if (acc > mejor[v].acc) mejor[v] = { t, acc };
            }
        });

        const slider = el("input", { type: "range", min: "0.01", max: "0.99", step: "0.01", value: "0.5" });
        const valor = el("strong", {}, "0.50");
        const tabla = el("div");
        box.insertBefore(el("div", { class: "chart-controls" },
            el("label", {}, "Umbral", slider, valor),
            C.legend(V)), body);
        box.insertBefore(tabla, body.nextSibling);

        const redraw = C.responsive(body, (width) => {
            const t = +slider.value;
            const actual = V.map((v, i) => ({ v, t, acc: exactitud(items, i, t).acc }));
            return Plot.plot({
                width, height: 320, style: C.style, marginLeft: 44, marginRight: 16, marginBottom: 42,
                x: { domain: [0, 1], label: "umbral de noul →", labelAnchor: "center", labelOffset: 36 },
                y: { domain: [0.5, 1], label: "↑ exactitud", grid: true, tickFormat: ".0%" },
                color: { domain: V, range: V.map((v) => C.colors[v]) },
                marks: [
                    Plot.ruleX([0.5], { stroke: "#9ca3af", strokeDasharray: "3,3" }),
                    Plot.ruleX([t], { stroke: "#111827" }),
                    Plot.line(curva, { x: "t", y: "acc", stroke: "v", strokeWidth: 2 }),
                    Plot.dot(actual, { x: "t", y: "acc", fill: "v", r: 4 }),
                    Plot.tip(curva, Plot.pointerX({
                        x: "t", y: "acc", stroke: "v",
                        title: (d) => `${C.names[d.v]}\numbral ${C.fmt(d.t)}\nexactitud ${C.pct(d.acc)}`,
                    })),
                ],
            });
        });

        const pintarTabla = () => {
            const t = +slider.value;
            valor.textContent = C.fmt(t);
            const filas = V.map((v, i) => {
                const r = exactitud(items, i, t);
                return el("tr", {},
                    el("td", {}, el("span", { style: { color: C.colors[v], fontWeight: 600 } }, C.names[v])),
                    el("td", { class: "num" }, el("strong", {}, C.pct(r.acc))),
                    el("td", { class: "num" }, r.fn),
                    el("td", { class: "num" }, r.fp),
                    el("td", { class: "num" }, `${C.pct(mejor[v].acc)} en ${C.fmt(mejor[v].t)}`));
            });
            tabla.replaceChildren(el("table", {},
                el("thead", {}, el("tr", {},
                    el("th", {}, "variante"), el("th", {}, "exactitud"),
                    el("th", {}, "falsos negativos"), el("th", {}, "falsos positivos"),
                    el("th", {}, "mejor umbral"))),
                el("tbody", {}, ...filas)));
        };
        slider.addEventListener("input", () => { pintarTabla(); redraw(); });
        pintarTabla();
    }

    // 2. Distribución del noul por variante, separada por etiqueta real.
    function distribucion(box, data, V) {
        if (!box) return;
        const body = box.querySelector(".chart-body");
        const rnd = C.random(20260925);
        const puntos = [];
        V.forEach((v, i) => {
            for (const it of data.items) {
                puntos.push({
                    v: C.names[v],
                    noul: it.n[i],
                    y: (it.y === 1 ? 1 : 0) + (rnd() - 0.5) * 0.62,
                    clase: it.y === 1 ? "positivo" : "negativo",
                    q: data.questions[it.q].q,
                });
            }
        });
        box.insertBefore(el("div", { class: "chart-controls" },
            C.legend(["positivo", "negativo"], { positivo: "etiqueta: sí se menciona", negativo: "etiqueta: no se menciona" })), body);

        C.responsive(body, (width) => Plot.plot({
            width, height: 440, style: C.style, marginLeft: 76, marginRight: 70, marginBottom: 42,
            x: { domain: [0, 1], label: "noul →", grid: true, labelAnchor: "center", labelOffset: 36 },
            y: { domain: [-0.45, 1.45], ticks: [0, 1], tickFormat: (d) => (d ? "positivos" : "negativos"), label: null },
            fy: { domain: V.map((v) => C.names[v]), label: null },
            color: { domain: ["positivo", "negativo"], range: [C.colors.positivo, C.colors.negativo] },
            marks: [
                Plot.ruleX([0.5], { stroke: "#111827", strokeDasharray: "3,3" }),
                Plot.dot(puntos, { x: "noul", y: "y", fy: "v", fill: "clase", r: 1.6, fillOpacity: 0.45 }),
                Plot.tip(puntos, Plot.pointer({
                    x: "noul", y: "y", fy: "v",
                    title: (d) => `${d.v} · ${d.clase}\nnoul ${C.fmt(d.noul, 3)}\n${d.q}`,
                })),
            ],
        }));
    }

    // 3. Explorador: los 16 textos reales de una pregunta con el noul de cada variante.
    function explorador(box, data, V) {
        if (!box) return;
        const body = box.querySelector(".chart-body");
        const porPregunta = data.questions.map(() => []);
        data.items.forEach((it) => porPregunta[it.q].push(it));
        const fallos = porPregunta.map((items) =>
            V.map((_, i) => items.filter((it) => (it.n[i] >= 0.5) !== (it.y === 1)).length));

        const select = el("select");
        const soloFallos = el("input", { type: "checkbox" });
        const llenar = () => {
            const actual = select.value;
            select.replaceChildren();
            for (const [cat, titulo] of Object.entries(CATS)) {
                const grupo = el("optgroup", { label: titulo });
                data.questions.forEach((q, qi) => {
                    if (q.cat !== cat) return;
                    const f = fallos[qi];
                    if (soloFallos.checked && f[0] + f[1] === 0) return;
                    grupo.append(el("option", { value: qi },
                        `${q.q}  (fallos: ${V.map((v, i) => C.names[v][0] + f[i]).join(" ")})`));
                });
                if (grupo.children.length) select.append(grupo);
            }
            if ([...select.options].some((o) => o.value === actual)) select.value = actual;
        };
        llenar();
        const inicial = data.questions.findIndex((q) => q.id === "dep_semar");
        if (inicial >= 0) select.value = String(inicial);

        box.insertBefore(el("div", { class: "chart-controls" },
            el("label", {}, "Pregunta", select),
            el("label", {}, soloFallos, "solo donde falla TypeSafe o Codiv")), body);

        const pintar = () => {
            const qi = +select.value;
            const items = [...porPregunta[qi]].sort((a, b) => b.y - a.y);
            const f = fallos[qi];
            const resumen = el("p", { class: "chart-caption" },
                `Umbral 0.5. Fallos en esta pregunta: ` +
                V.map((v, i) => `${C.names[v]} ${f[i]} de 16`).join(", ") + ".");
            const filas = items.map((it) => el("tr", {},
                el("td", {}, it.y ? "sí" : "no"),
                el("td", { class: "wrap" }, it.t, el("br"),
                    el("small", { style: { color: "#6b7280" } }, it.d)),
                ...V.map((_, i) => el("td", {
                    class: "num " + ((it.n[i] >= 0.5) === (it.y === 1) ? "hit" : "miss"),
                }, C.fmt(it.n[i])))));
            body.replaceChildren(resumen, el("table", {},
                el("thead", {}, el("tr", {},
                    el("th", {}, "etiqueta"), el("th", {}, "texto"),
                    ...V.map((v) => el("th", {}, C.names[v])))),
                el("tbody", {}, ...filas)));
        };
        select.addEventListener("change", pintar);
        soloFallos.addEventListener("change", () => { llenar(); pintar(); });
        pintar();
    }
})();
