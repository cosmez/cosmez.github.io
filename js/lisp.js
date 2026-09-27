// Intérprete de Scheme para el landing: el subconjunto de The Little Schemer
// y una demo que escribe sola la derivación del combinador Y (capítulo 9).
// Se monta en cada `.repl[data-lang]` de la página. Sin dependencias.
(function () {
    "use strict";

    // Límites para que un ciclo infinito conteste en vez de congelar la pestaña.
    const MAX_STEPS = 100000;
    const MAX_DEPTH = 2000;

    const TEXT = {
        en: {
            title: "The Little Schemer, ch. 9: deriving Y",
            hint: "click to type",
            restart: "restart demo",
            input: "Scheme input",
            paused: "demo paused. Everything defined so far is still here. Try (help)",
            steps: "did not finish after 100,000 steps",
            depth: "did not finish: recursion went past 2,000 levels",
            help: [
                "special forms: define lambda cond else if and or let quote",
                "primitives: ",
                "Enter evaluates, Shift+Enter adds a line, ↑ ↓ history",
            ],
            unbound: (n) => `unbound variable: ${n}`,
            notProc: (v) => `not a procedure: ${v}`,
            arity: (f, n, m) => `${f}: expected ${n} argument${n === 1 ? "" : "s"}, got ${m}`,
            emptyList: (f, v) => `${f} of ${v}: needs a non-empty list`,
            cons: (v) => `cons: the second argument must be a list, got ${v}`,
            notNumber: (f, v) => `${f}: expected a number, got ${v}`,
            syntax: (f) => `bad syntax: ${f}`,
            emptyApp: () => "() must be quoted: '()",
            extraParen: () => "unexpected )",
            badChar: (c) => `unexpected character: ${c}`,
            incomplete: () => "missing )",
        },
        es: {
            title: "The Little Schemer, cap. 9: derivando Y",
            hint: "haz clic para escribir",
            restart: "reiniciar demo",
            input: "Entrada de Scheme",
            paused: "demo en pausa. Lo definido hasta aquí sigue disponible. Prueba (help)",
            steps: "no terminó después de 100,000 pasos",
            depth: "no terminó: la recursión pasó de 2,000 niveles",
            help: [
                "formas especiales: define lambda cond else if and or let quote",
                "primitivas: ",
                "Enter evalúa, Shift+Enter agrega una línea, ↑ ↓ historial",
            ],
            unbound: (n) => `variable sin definir: ${n}`,
            notProc: (v) => `no es un procedimiento: ${v}`,
            arity: (f, n, m) => `${f}: esperaba ${n} argumento${n === 1 ? "" : "s"}, recibió ${m}`,
            emptyList: (f, v) => `${f} de ${v}: necesita una lista no vacía`,
            cons: (v) => `cons: el segundo argumento debe ser una lista, llegó ${v}`,
            notNumber: (f, v) => `${f}: esperaba un número, llegó ${v}`,
            syntax: (f) => `sintaxis inválida: ${f}`,
            emptyApp: () => "() necesita comilla: '()",
            extraParen: () => "sobra un )",
            badChar: (c) => `carácter inesperado: ${c}`,
            incomplete: () => "falta un )",
        },
    };

    // La demo: cada paso son comentarios y una o más expresiones.
    const LENGTH_BODY = [
        "(lambda (l)",
        "  (cond",
        "    ((null? l) 0)",
        "    (else (add1 (length (cdr l))))))",
    ];

    const STEPS = [
        {
            note: { en: ["length, the usual way"], es: ["length, como siempre"] },
            code: [
                "(define length\n" + LENGTH_BODY.map((s) => "  " + s).join("\n") + ")",
                "(length '(a b c))",
            ],
        },
        {
            note: { en: ["eternity never returns"], es: ["eternity nunca regresa"] },
            code: [
                "(define eternity\n  (lambda (x)\n    (eternity x)))",
                "(eternity 'x)",
            ],
        },
        {
            note: {
                en: ["what if we couldn't use define?", "length0 only measures (); anything else goes to eternity"],
                es: ["¿y si no pudiéramos usar define?", "length0 solo sabe medir (); lo demás se va a eternity"],
            },
            code: [
                "((lambda (l)\n" +
                "   (cond\n" +
                "     ((null? l) 0)\n" +
                "     (else (add1 (eternity (cdr l))))))\n" +
                " '(apples))",
            ],
        },
        {
            note: { en: ["length≤1: length0 inside itself"], es: ["length≤1: length0 dentro de sí misma"] },
            code: [
                "((lambda (l)\n" +
                "   (cond\n" +
                "     ((null? l) 0)\n" +
                "     (else\n" +
                "      (add1\n" +
                "       ((lambda (l)\n" +
                "          (cond\n" +
                "            ((null? l) 0)\n" +
                "            (else (add1 (eternity (cdr l))))))\n" +
                "        (cdr l))))))\n" +
                " '(apples))",
            ],
        },
        {
            note: { en: ["pull out the function that repeats"], es: ["sacamos la función que se repite"] },
            code: [
                "(((lambda (length)\n" +
                "    (lambda (l)\n" +
                "      (cond\n" +
                "        ((null? l) 0)\n" +
                "        (else (add1 (length (cdr l)))))))\n" +
                "  eternity)\n" +
                " '())",
            ],
        },
        {
            note: {
                en: ["give the pattern a name: mk-length", "two calls, so length≤1"],
                es: ["le ponemos nombre al patrón: mk-length", "dos llamadas, así que length≤1"],
            },
            code: [
                "(((lambda (mk-length)\n" +
                "    (mk-length\n" +
                "     (mk-length eternity)))\n" +
                "  (lambda (length)\n" +
                "    (lambda (l)\n" +
                "      (cond\n" +
                "        ((null? l) 0)\n" +
                "        (else (add1 (length (cdr l))))))))\n" +
                " '(apples))",
            ],
        },
        {
            note: {
                en: ["mk-length receives itself: length≤1 again"],
                es: ["mk-length se recibe a sí misma: otra vez length≤1"],
            },
            code: [
                "(((lambda (mk-length)\n" +
                "    (mk-length mk-length))\n" +
                "  (lambda (mk-length)\n" +
                "    (lambda (l)\n" +
                "      (cond\n" +
                "        ((null? l) 0)\n" +
                "        (else (add1 ((mk-length eternity) (cdr l))))))))\n" +
                " '(apples))",
            ],
        },
        {
            note: {
                en: ["one more mk-length each time it's needed"],
                es: ["un mk-length más cada vez que hace falta"],
            },
            code: [
                "(((lambda (mk-length)\n" +
                "    (mk-length mk-length))\n" +
                "  (lambda (mk-length)\n" +
                "    (lambda (l)\n" +
                "      (cond\n" +
                "        ((null? l) 0)\n" +
                "        (else (add1 ((mk-length mk-length) (cdr l))))))))\n" +
                " '(a b c d e))",
            ],
        },
        {
            note: {
                en: ["take (mk-length mk-length) out as length"],
                es: ["sacamos (mk-length mk-length) como length"],
            },
            code: [
                "(((lambda (mk-length)\n" +
                "    (mk-length mk-length))\n" +
                "  (lambda (mk-length)\n" +
                "    ((lambda (length)\n" +
                "       (lambda (l)\n" +
                "         (cond\n" +
                "           ((null? l) 0)\n" +
                "           (else (add1 (length (cdr l)))))))\n" +
                "     (mk-length mk-length))))\n" +
                " '(apples))",
            ],
        },
        {
            note: {
                en: ["(mk-length mk-length) ran too early", "wrapping it in a lambda delays it"],
                es: ["(mk-length mk-length) se evaluó antes de tiempo", "envolverlo en una lambda lo retrasa"],
            },
            code: [
                "(((lambda (mk-length)\n" +
                "    (mk-length mk-length))\n" +
                "  (lambda (mk-length)\n" +
                "    ((lambda (length)\n" +
                "       (lambda (l)\n" +
                "         (cond\n" +
                "           ((null? l) 0)\n" +
                "           (else (add1 (length (cdr l)))))))\n" +
                "     (lambda (x)\n" +
                "       ((mk-length mk-length) x)))))\n" +
                " '(a b c))",
            ],
        },
        {
            note: {
                en: ["the part that looks like length becomes an argument: le"],
                es: ["lo que parece length pasa como argumento: le"],
            },
            code: [
                "(((lambda (le)\n" +
                "    ((lambda (mk-length)\n" +
                "       (mk-length mk-length))\n" +
                "     (lambda (mk-length)\n" +
                "       (le (lambda (x)\n" +
                "             ((mk-length mk-length) x))))))\n" +
                "  (lambda (length)\n" +
                "    (lambda (l)\n" +
                "      (cond\n" +
                "        ((null? l) 0)\n" +
                "        (else (add1 (length (cdr l))))))))\n" +
                " '(a b c))",
            ],
        },
        {
            note: {
                en: ["what's left is the applicative-order Y combinator"],
                es: ["lo que queda es el combinador Y de orden aplicativo"],
            },
            code: [
                "(define Y\n" +
                "  (lambda (le)\n" +
                "    ((lambda (f) (f f))\n" +
                "     (lambda (f)\n" +
                "       (le (lambda (x) ((f f) x)))))))",
                "((Y (lambda (length)\n" +
                LENGTH_BODY.map((s) => "      " + s).join("\n") + "))\n" +
                " '(a b c d e f g))",
            ],
        },
        {
            note: {
                en: ["your turn: click here and type (help)"],
                es: ["tu turno: haz clic aquí y escribe (help)"],
            },
            code: [],
        },
    ];

    // ---- Datos ----
    // Símbolos: strings de JS. Listas: arreglos (sin pares punteados, como en el libro).

    class Closure {
        constructor(params, body, env, name) {
            this.params = params;
            this.body = body;
            this.env = env;
            this.name = name;
        }
    }

    class Prim {
        constructor(name, min, max, fn) {
            this.name = name;
            this.min = min;
            this.max = max;
            this.fn = fn;
        }
    }

    class LispError extends Error {
        constructor(key, args) {
            super(key);
            this.key = key;
            this.args = args || [];
        }
    }

    // Se detuvo por los límites: "steps" o "depth".
    class Halt extends Error {
        constructor(kind) {
            super(kind);
            this.kind = kind;
        }
    }

    const VOID = { toString: () => "" };
    const HELP = { toString: () => "" };

    class Env {
        constructor(vars, outer) {
            this.vars = vars;
            this.outer = outer;
        }

        lookup(name) {
            for (let e = this; e; e = e.outer) {
                if (e.vars.has(name)) return e.vars.get(name);
            }
            throw new LispError("unbound", [name]);
        }
    }

    function show(v) {
        if (v === true) return "#t";
        if (v === false) return "#f";
        if (typeof v === "number" || typeof v === "string") return String(v);
        if (Array.isArray(v)) return "(" + v.map(show).join(" ") + ")";
        if (v instanceof Closure) return v.name ? `#<procedure:${v.name}>` : "#<procedure>";
        if (v instanceof Prim) return `#<procedure:${v.name}>`;
        return String(v);
    }

    // ---- Lector ----

    function tokenize(src) {
        const tokens = [];
        let i = 0;
        while (i < src.length) {
            const c = src[i];
            if (/\s/.test(c)) {
                i++;
            } else if (c === ";") {
                while (i < src.length && src[i] !== "\n") i++;
            } else if (c === "(" || c === "[") {
                tokens.push("(");
                i++;
            } else if (c === ")" || c === "]") {
                tokens.push(")");
                i++;
            } else if (c === "'") {
                tokens.push("'");
                i++;
            } else {
                let j = i;
                while (j < src.length && !/[\s()\[\]';"]/.test(src[j])) j++;
                if (j === i) throw new LispError("badChar", [c]);
                tokens.push(src.slice(i, j));
                i = j;
            }
        }
        return tokens;
    }

    function atom(tok) {
        if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(tok)) return Number(tok);
        if (tok === "#t" || tok === "#true") return true;
        if (tok === "#f" || tok === "#false") return false;
        return tok;
    }

    function parseAll(src) {
        const tokens = tokenize(src);
        let pos = 0;

        function read() {
            if (pos >= tokens.length) throw new LispError("incomplete");
            const tok = tokens[pos++];
            if (tok === "(") {
                const list = [];
                for (;;) {
                    if (pos >= tokens.length) throw new LispError("incomplete");
                    if (tokens[pos] === ")") break;
                    list.push(read());
                }
                pos++;
                return list;
            }
            if (tok === ")") throw new LispError("extraParen");
            if (tok === "'") return ["quote", read()];
            return atom(tok);
        }

        const forms = [];
        while (pos < tokens.length) forms.push(read());
        return forms;
    }

    // ---- Primitivas ----

    const isList = Array.isArray;

    function num(f, v) {
        if (typeof v !== "number") throw new LispError("notNumber", [f, show(v)]);
        return v;
    }

    function nonEmpty(f, l) {
        if (!isList(l) || l.length === 0) throw new LispError("emptyList", [f, show(l)]);
        return l;
    }

    function equal(a, b) {
        if (isList(a) && isList(b)) {
            return a.length === b.length && a.every((x, i) => equal(x, b[i]));
        }
        return a === b;
    }

    function compare(f, test) {
        return new Prim(f, 2, 2, ([a, b]) => test(num(f, a), num(f, b)));
    }

    const PRIMS = [
        new Prim("car", 1, 1, ([l]) => nonEmpty("car", l)[0]),
        new Prim("cdr", 1, 1, ([l]) => nonEmpty("cdr", l).slice(1)),
        new Prim("cons", 2, 2, ([a, l]) => {
            if (!isList(l)) throw new LispError("cons", [show(l)]);
            return [a].concat(l);
        }),
        new Prim("null?", 1, 1, ([l]) => isList(l) && l.length === 0),
        new Prim("atom?", 1, 1, ([a]) => !isList(a)),
        new Prim("eq?", 2, 2, ([a, b]) => a === b || (isList(a) && isList(b) && a.length === 0 && b.length === 0)),
        new Prim("equal?", 2, 2, ([a, b]) => equal(a, b)),
        new Prim("zero?", 1, 1, ([n]) => num("zero?", n) === 0),
        new Prim("number?", 1, 1, ([n]) => typeof n === "number"),
        new Prim("add1", 1, 1, ([n]) => num("add1", n) + 1),
        new Prim("sub1", 1, 1, ([n]) => num("sub1", n) - 1),
        new Prim("+", 0, Infinity, (args) => args.reduce((s, n) => s + num("+", n), 0)),
        new Prim("-", 1, Infinity, (args) => (args.length === 1
            ? -num("-", args[0])
            : args.slice(1).reduce((s, n) => s - num("-", n), num("-", args[0])))),
        new Prim("*", 0, Infinity, (args) => args.reduce((s, n) => s * num("*", n), 1)),
        compare("=", (a, b) => a === b),
        compare("<", (a, b) => a < b),
        compare(">", (a, b) => a > b),
        new Prim("not", 1, 1, ([v]) => v === false),
        new Prim("list", 0, Infinity, (args) => args),
        new Prim("help", 0, 0, () => HELP),
    ];

    const PRIM_NAMES = new Set(PRIMS.map((p) => p.name));
    const SPECIAL = new Set(["quote", "lambda", "define", "cond", "if", "and", "or", "let"]);

    // ---- Evaluador ----
    // Las llamadas en posición de cola no crecen la pila (el `for` de evaluate).

    function validParams(p) {
        return typeof p === "string" || (isList(p) && p.every((s) => typeof s === "string"));
    }

    function check(ok, x) {
        if (!ok) throw new LispError("syntax", [`(${show(x[0])} …)`]);
    }

    function bind(f, args) {
        const vars = new Map();
        if (typeof f.params === "string") {
            vars.set(f.params, args);
        } else {
            if (args.length !== f.params.length) {
                throw new LispError("arity", [f.name || "lambda", f.params.length, args.length]);
            }
            f.params.forEach((p, i) => vars.set(p, args[i]));
        }
        return new Env(vars, f.env);
    }

    function createInterpreter() {
        let global;
        let steps = 0;

        function reset() {
            global = new Env(new Map(PRIMS.map((p) => [p.name, p])), null);
        }

        function run(form) {
            steps = 0;
            return evaluate(form, global, 0);
        }

        function evaluate(x, env, depth) {
            if (depth > MAX_DEPTH) throw new Halt("depth");
            for (;;) {
                if (++steps > MAX_STEPS) throw new Halt("steps");
                if (typeof x === "string") return env.lookup(x);
                if (!isList(x)) return x;
                if (x.length === 0) throw new LispError("emptyApp");

                const op = x[0];
                if (typeof op === "string" && SPECIAL.has(op)) {
                    if (op === "quote") {
                        check(x.length === 2, x);
                        return x[1];
                    }
                    if (op === "lambda") {
                        check(x.length >= 3 && validParams(x[1]), x);
                        return new Closure(x[1], x.slice(2), env, null);
                    }
                    if (op === "define") {
                        let name, value;
                        if (isList(x[1])) {
                            const head = x[1];
                            check(x.length >= 3 && typeof head[0] === "string" && validParams(head.slice(1)), x);
                            name = head[0];
                            value = new Closure(head.slice(1), x.slice(2), env, name);
                        } else {
                            check(x.length === 3 && typeof x[1] === "string", x);
                            name = x[1];
                            value = evaluate(x[2], env, depth + 1);
                            if (value instanceof Closure && !value.name) value.name = name;
                        }
                        env.vars.set(name, value);
                        return VOID;
                    }
                    if (op === "if") {
                        check(x.length === 3 || x.length === 4, x);
                        if (evaluate(x[1], env, depth + 1) !== false) x = x[2];
                        else if (x.length === 4) x = x[3];
                        else return VOID;
                        continue;
                    }
                    if (op === "cond") {
                        let body = null;
                        for (let i = 1; i < x.length && !body; i++) {
                            const clause = x[i];
                            check(isList(clause) && clause.length >= 1, x);
                            if (clause[0] === "else") {
                                check(clause.length >= 2, x);
                                body = clause.slice(1);
                            } else {
                                const test = evaluate(clause[0], env, depth + 1);
                                if (test !== false) {
                                    if (clause.length === 1) return test;
                                    body = clause.slice(1);
                                }
                            }
                        }
                        if (!body) return VOID;
                        for (let i = 0; i < body.length - 1; i++) evaluate(body[i], env, depth + 1);
                        x = body[body.length - 1];
                        continue;
                    }
                    if (op === "and" || op === "or") {
                        if (x.length === 1) return op === "and";
                        let i = 1;
                        for (; i < x.length - 1; i++) {
                            const v = evaluate(x[i], env, depth + 1);
                            if (op === "and" && v === false) return false;
                            if (op === "or" && v !== false) return v;
                        }
                        x = x[i];
                        continue;
                    }
                    // let
                    check(x.length >= 3 && isList(x[1]) &&
                        x[1].every((b) => isList(b) && b.length === 2 && typeof b[0] === "string"), x);
                    const vars = new Map();
                    for (const [n, e] of x[1]) vars.set(n, evaluate(e, env, depth + 1));
                    env = new Env(vars, env);
                    for (let i = 2; i < x.length - 1; i++) evaluate(x[i], env, depth + 1);
                    x = x[x.length - 1];
                    continue;
                }

                const f = evaluate(op, env, depth + 1);
                const args = new Array(x.length - 1);
                for (let i = 1; i < x.length; i++) args[i - 1] = evaluate(x[i], env, depth + 1);

                if (f instanceof Prim) {
                    if (args.length < f.min || args.length > f.max) {
                        throw new LispError("arity", [f.name, f.min, args.length]);
                    }
                    return f.fn(args);
                }
                if (!(f instanceof Closure)) throw new LispError("notProc", [show(f)]);
                env = bind(f, args);
                for (let i = 0; i < f.body.length - 1; i++) evaluate(f.body[i], env, depth + 1);
                x = f.body[f.body.length - 1];
            }
        }

        reset();
        return { reset, run };
    }

    // ---- Presentación ----

    const KEYWORDS = new Set([...SPECIAL, "else"]);

    function esc(s) {
        return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function span(cls, s) {
        return `<span class="t-${cls}">${esc(s)}</span>`;
    }

    function highlight(line) {
        let out = "";
        let i = 0;
        let quoted = false;
        while (i < line.length) {
            const c = line[i];
            if (c === ";") {
                out += span("c", line.slice(i));
                break;
            }
            if ("()[]".includes(c)) {
                out += span("p", c);
                quoted = false;
                i++;
                continue;
            }
            if (c === "'") {
                out += span("q", c);
                quoted = true;
                i++;
                continue;
            }
            let j = i;
            if (/\s/.test(c)) {
                while (j < line.length && /\s/.test(line[j])) j++;
                out += line.slice(i, j);
                i = j;
                continue;
            }
            while (j < line.length && !/[\s()\[\]';]/.test(line[j])) j++;
            if (j === i) j = i + 1;
            const w = line.slice(i, j);
            if (quoted) out += span("q", w);
            else if (KEYWORDS.has(w)) out += span("k", w);
            else if (PRIM_NAMES.has(w)) out += span("b", w);
            else if (/^[+-]?\.?\d/.test(w) || w === "#t" || w === "#f") out += span("n", w);
            else out += esc(w);
            quoted = false;
            i = j;
        }
        return out;
    }

    function renderInput(src) {
        return src.split("\n")
            .map((l, i) => (i === 0 ? '<span class="repl-prompt">&gt; </span>' : "  ") + highlight(l))
            .join("\n");
    }

    function openParens(src) {
        let depth = 0;
        for (const line of src.split("\n")) {
            for (const c of line) {
                if (c === ";") break;
                if (c === "(" || c === "[") depth++;
                else if (c === ")" || c === "]") depth--;
            }
        }
        return Math.max(depth, 0);
    }

    function needsMore(src) {
        try {
            parseAll(src);
            return false;
        } catch (e) {
            return e instanceof LispError && e.key === "incomplete";
        }
    }

    function el(tag, cls, text) {
        const node = document.createElement(tag);
        if (cls) node.className = cls;
        if (text != null) node.textContent = text;
        return node;
    }

    const CANCEL = { cancelled: true };
    const MAX_LOG = 400;

    function mount(root, lang) {
        const t = TEXT[lang] || TEXT.en;
        const interp = createInterpreter();
        const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        root.textContent = "";
        const bar = el("div", "repl-bar");
        const title = el("span", "repl-title");
        title.append(el("b", null, "λ "), t.title);
        const hint = el("span", "repl-hint", t.hint);
        const restart = el("button", "repl-btn", t.restart);
        restart.type = "button";
        restart.hidden = true;
        bar.append(title, hint, restart);

        const screen = el("div", "repl-screen");
        screen.tabIndex = 0;
        const log = el("div", "repl-log");
        const inputRow = el("div", "repl-input");
        inputRow.hidden = true;
        const ta = el("textarea");
        ta.rows = 1;
        ta.spellcheck = false;
        ta.autocapitalize = "off";
        ta.setAttribute("autocomplete", "off");
        ta.setAttribute("autocorrect", "off");
        ta.setAttribute("wrap", "off");
        ta.setAttribute("aria-label", t.input);
        inputRow.append(el("span", "repl-prompt", "> "), ta);
        screen.append(log, inputRow);
        root.append(bar, screen);

        // ---- Salida ----

        function nearBottom() {
            return screen.scrollHeight - screen.scrollTop - screen.clientHeight < 60;
        }

        function append(node) {
            const stick = nearBottom();
            log.append(node);
            while (log.childElementCount > MAX_LOG) log.firstElementChild.remove();
            if (stick) screen.scrollTop = screen.scrollHeight;
        }

        function line(cls, text) {
            append(el("div", cls, text));
        }

        // Un comentario suelto se pega a la entrada que sigue.
        function inputNode(src) {
            return el("div", /^\s*;[^\n]*$/.test(src) ? "repl-in is-comment" : "repl-in");
        }

        function echo(src) {
            const node = inputNode(src);
            node.innerHTML = renderInput(src);
            append(node);
        }

        function printError(e) {
            if (e instanceof Halt) {
                line("repl-halt", ";; " + t[e.kind]);
                return "halt";
            }
            if (e instanceof RangeError) {
                line("repl-halt", ";; " + t.depth);
                return "halt";
            }
            if (e instanceof LispError) {
                line("repl-err", ";; error: " + t[e.key](...e.args));
                return "error";
            }
            throw e;
        }

        // Evalúa todo lo que trae `src` y devuelve qué tipo de salida hubo.
        function evalInput(src) {
            let forms;
            try {
                forms = parseAll(src);
            } catch (e) {
                return printError(e);
            }
            let kind = "none";
            for (const form of forms) {
                try {
                    const v = interp.run(form);
                    if (v === HELP) {
                        t.help.forEach((h, i) => line("repl-note",
                            ";; " + h + (i === 1 ? PRIMS.map((p) => p.name).join(" ") : "")));
                        kind = "value";
                    } else if (v !== VOID) {
                        line("repl-out", show(v));
                        kind = "value";
                    }
                } catch (e) {
                    return printError(e);
                }
            }
            return kind;
        }

        // ---- Demo ----

        let mode = "demo";
        let token = 0;
        let typing = null;
        let visible = true;
        let waiters = [];

        const active = () => visible && !document.hidden;

        function wakeUp() {
            if (!active()) return;
            const w = waiters;
            waiters = [];
            w.forEach((r) => r());
        }

        async function sleep(ms, my) {
            if (ms > 0) await new Promise((r) => setTimeout(r, ms));
            if (!active()) await new Promise((r) => waiters.push(r));
            if (my !== token) throw CANCEL;
        }

        async function type(src, my) {
            typing = inputNode(src);
            append(typing);
            if (reduced) {
                typing.innerHTML = renderInput(src);
            } else {
                let i = 0;
                while (i < src.length) {
                    const c = src[i++];
                    // La sangría aparece de golpe, como en un editor.
                    if (c === "\n") while (src[i] === " ") i++;
                    const stick = nearBottom();
                    typing.innerHTML = renderInput(src.slice(0, i)) + '<span class="repl-cursor"></span>';
                    if (stick) screen.scrollTop = screen.scrollHeight;
                    await sleep(c === "\n" ? 140 : 14 + Math.random() * 34, my);
                }
                typing.innerHTML = renderInput(src);
            }
            typing = null;
        }

        async function runDemo(my) {
            const pause = (ms) => sleep(reduced ? 0 : ms, my);
            try {
                for (;;) {
                    log.textContent = "";
                    interp.reset();
                    await pause(700);
                    for (const step of STEPS) {
                        for (const n of step.note[lang] || step.note.en) {
                            await type(";; " + n, my);
                            await pause(250);
                        }
                        for (const src of step.code) {
                            await type(src, my);
                            await pause(350);
                            const kind = evalInput(src);
                            await pause(kind === "halt" ? 2600 : 1500);
                        }
                    }
                    if (reduced) {
                        enableInput();
                        return;
                    }
                    await pause(15000);
                }
            } catch (e) {
                if (e !== CANCEL) throw e;
            }
        }

        function startDemo() {
            mode = "demo";
            inputRow.hidden = true;
            restart.hidden = true;
            hint.hidden = false;
            runDemo(++token);
        }

        function enableInput() {
            mode = "user";
            inputRow.hidden = false;
            restart.hidden = false;
            hint.hidden = true;
            screen.scrollTop = screen.scrollHeight;
        }

        function takeOver() {
            if (mode === "user") return;
            token++;
            if (typing) typing.remove();
            typing = null;
            line("repl-note", ";; " + t.paused);
            enableInput();
        }

        // ---- Entrada del visitante ----

        const history = [];
        let hIndex = 0;

        function resize() {
            ta.rows = ta.value.split("\n").length;
        }

        function setInput(value) {
            ta.value = value;
            resize();
            ta.selectionStart = ta.selectionEnd = value.length;
        }

        ta.addEventListener("input", resize);

        ta.addEventListener("keydown", (e) => {
            const before = ta.value.slice(0, ta.selectionStart);
            const after = ta.value.slice(ta.selectionEnd);
            if (e.key === "Enter") {
                e.preventDefault();
                const src = ta.value;
                if (e.shiftKey || needsMore(src) || after.trim() !== "") {
                    const indent = "  ".repeat(openParens(before));
                    setInput(before + "\n" + indent + after);
                    ta.selectionStart = ta.selectionEnd = before.length + 1 + indent.length;
                    return;
                }
                if (src.trim() === "") return;
                history.push(src);
                hIndex = history.length;
                setInput("");
                echo(src);
                evalInput(src);
                screen.scrollTop = screen.scrollHeight;
            } else if (e.key === "ArrowUp" && !before.includes("\n") && hIndex > 0) {
                e.preventDefault();
                setInput(history[--hIndex]);
            } else if (e.key === "ArrowDown" && !after.includes("\n") && hIndex < history.length) {
                e.preventDefault();
                hIndex++;
                setInput(hIndex < history.length ? history[hIndex] : "");
            }
        });

        screen.addEventListener("click", () => {
            takeOver();
            const sel = window.getSelection && window.getSelection();
            if (!sel || sel.isCollapsed) ta.focus({ preventScroll: true });
        });

        screen.addEventListener("keydown", (e) => {
            if (e.target !== screen || e.ctrlKey || e.metaKey || e.altKey) return;
            if (e.key.length === 1 || e.key === "Enter") {
                takeOver();
                ta.focus({ preventScroll: true });
            }
        });

        restart.addEventListener("click", startDemo);

        // La demo se detiene fuera de pantalla o con la pestaña oculta.
        if ("IntersectionObserver" in window) {
            new IntersectionObserver((entries) => {
                visible = entries[entries.length - 1].isIntersecting;
                wakeUp();
            }).observe(root);
        }
        document.addEventListener("visibilitychange", wakeUp);

        startDemo();
    }

    window.LispRepl = { createInterpreter, parseAll, show, STEPS, mount };

    if (typeof document !== "undefined") {
        document.querySelectorAll(".repl[data-lang]").forEach((node) => mount(node, node.dataset.lang));
    }
})();
