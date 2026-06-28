// JSON modules are loaded by the bundler (Vite) at runtime. We keep them
// untyped for the type-checker so it doesn't infer huge literal types from
// large data files (which OOMs tsc). Consumers cast to the right type.
declare module '*.json' {
  const value: unknown;
  export default value;
}
