const developmentEnvironments = [
  'development',
  'test'
];

module.exports = api => {
  const development = api.env(developmentEnvironments);

  return {
    ignore: [],
    presets: [
      [
        require('@babel/preset-env'),
        {
          targets: {
            node: '10.15'
          },
          useBuiltIns: false,
          debug: !!development
        }
      ]
    ],
    plugins: [
      [
        require("@babel/plugin-proposal-class-properties")
      ]
    ]
  };
};