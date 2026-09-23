(function () {
  // "Zod-lite": una API mínima compatible con Zod v4 (z.object, z.string,
  // .min, .email, .optional, .parse, .safeParse) para usarla en el playground
  // sin depender de un build UMD/global de la librería real (Zod es ESM-first
  // y no publica un bundle listo para <script> clásico). En el proyecto real
  // se usa `import { z } from 'zod'` tal cual.
  function issue(path, message) {
    return { path, message };
  }

  function StringSchema(rules = [], isOptional = false) {
    const schema = {
      _type: 'string',
      _optional: isOptional,
      min(n, msg) {
        return StringSchema(
          rules.concat([(v, path, issues) => {
            if (typeof v !== 'string' || v.trim().length < n) {
              issues.push(issue(path, msg || `Debe tener al menos ${n} caracteres`));
            }
          }]),
          isOptional,
        );
      },
      email(msg) {
        return StringSchema(
          rules.concat([(v, path, issues) => {
            if (typeof v !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
              issues.push(issue(path, msg || 'Correo inválido'));
            }
          }]),
          isOptional,
        );
      },
      optional() {
        return StringSchema(rules, true);
      },
      _validate(v, path, issues) {
        if (v === undefined && isOptional) return;
        if (typeof v !== 'string') {
          issues.push(issue(path, 'Se esperaba texto'));
          return;
        }
        rules.forEach((rule) => rule(v, path, issues));
      },
    };
    return schema;
  }

  function ObjectSchema(shape) {
    const schema = {
      _type: 'object',
      _shape: shape,
      _validate(v, path, issues) {
        if (typeof v !== 'object' || v === null) {
          issues.push(issue(path, 'Se esperaba un objeto'));
          return;
        }
        Object.keys(shape).forEach((key) => {
          shape[key]._validate(v[key], path.concat([key]), issues);
        });
      },
      parse(v) {
        const issues = [];
        schema._validate(v, [], issues);
        if (issues.length) {
          const err = new Error('Validación falló');
          err.issues = issues;
          throw err;
        }
        return v;
      },
      safeParse(v) {
        const issues = [];
        schema._validate(v, [], issues);
        if (issues.length) return { success: false, error: { issues } };
        return { success: true, data: v };
      },
    };
    return schema;
  }

  window.MiniZod = {
    string: () => StringSchema(),
    object: (shape) => ObjectSchema(shape),
  };
})();
