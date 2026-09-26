// Helpers compartidos para las gráficas del blog.
// Requiere d3 y Observable Plot cargados antes (ver CLAUDE.md).
(function () {
    "use strict";

    const Charts = {
        // Colores fijos por serie. Un post puede agregar los suyos.
        colors: {
            typesafe: "#2563eb",
            codiv: "#d97706",
            laya: "#7c3aed",
            positivo: "#16a34a",
            negativo: "#9ca3af",
            error: "#dc2626",
        },

        names: {
            typesafe: "TypeSafe",
            codiv: "Codiv",
            laya: "Laya",
        },

        // Estilo base para Plot: hereda la tipografía del sitio.
        style: {
            fontFamily: "inherit",
            fontSize: "12px",
            background: "transparent",
            overflow: "visible",
        },

        // Los datos de cada post son un .js que asigna una variable global
        // (window.DATOS_X = {...}), no un .json: fetch() no funciona al abrir
        // el HTML directo desde disco (file://) y un <script> sí.
        data(name) {
            const d = window[name];
            if (d == null) throw new Error(`no se cargó ${name}`);
            return d;
        },

        // Redibuja `render(width)` dentro de `el` al cargar y al cambiar el ancho.
        responsive(el, render) {
            let last = 0;
            const draw = () => {
                const w = Math.floor(el.clientWidth);
                if (w === last || w === 0) return;
                last = w;
                el.replaceChildren(render(w));
            };
            draw();
            let t;
            new ResizeObserver(() => {
                clearTimeout(t);
                t = setTimeout(draw, 120);
            }).observe(el);
            return () => { last = 0; draw(); };
        },

        // Muestra un error dentro del contenedor en vez de dejarlo vacío.
        fail(el, err) {
            console.error(err);
            el.replaceChildren(Charts.el("p", { class: "chart-error" },
                "No se pudo cargar la gráfica: " + err.message));
        },

        fmt(n, digits = 2) {
            return n == null ? "–" : Number(n).toFixed(digits);
        },

        pct(n, digits = 1) {
            return n == null ? "–" : (n * 100).toFixed(digits) + "%";
        },

        // Crea un elemento: el("td", {class: "x"}, "texto", otroNodo)
        el(tag, attrs = {}, ...children) {
            const node = document.createElement(tag);
            for (const [k, v] of Object.entries(attrs)) {
                if (v == null) continue;
                if (k === "style" && typeof v === "object") Object.assign(node.style, v);
                else node.setAttribute(k, v);
            }
            for (const c of children) {
                if (c == null) continue;
                node.append(c instanceof Node ? c : String(c));
            }
            return node;
        },

        // Leyenda simple con cuadritos de color.
        legend(keys, labels = Charts.names) {
            return Charts.el("div", { class: "chart-legend" },
                ...keys.map((k) => Charts.el("span", {},
                    Charts.el("i", { style: { background: Charts.colors[k] } }),
                    labels[k] || k)));
        },

        // PRNG determinista para jitter estable entre recargas.
        random(seed = 1) {
            let s = seed >>> 0;
            return () => {
                s = (s + 0x6d2b79f5) >>> 0;
                let t = s;
                t = Math.imul(t ^ (t >>> 15), t | 1);
                t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
                return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
            };
        },
    };

    window.Charts = Charts;
})();
