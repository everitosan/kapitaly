module.exports = function (api) {
  // La configuración solo depende del entorno (Jest usa NODE_ENV=test).
  const isTest = api.env('test');
  return {
    presets: ['babel-preset-expo'],
    // Las migraciones de Drizzle importan archivos .sql como texto.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
    // babel-preset-expo solo activa el React Compiler con Metro. En Jest se aplica igual que en el
    // bundle (mismas opciones, solo código propio) para que las pruebas vean lo que corre en la app.
    overrides: isTest
      ? [
          {
            // Las pruebas no van en el bundle; además, compilar las fábricas de jest.mock las rompe.
            exclude: [/node_modules/, /__tests__/],
            plugins: [
              [
                'babel-plugin-react-compiler',
                {
                  target: '19',
                  panicThreshold: 'NONE',
                  customOptOutDirectives: ['widget', 'use no memo', 'use no forget'],
                },
              ],
            ],
          },
        ]
      : [],
  };
};
