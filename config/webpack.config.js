const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const PORT = process.env.PORT || 3012;

module.exports = (env = {}) => {
  const useDotenv = env.useDotenv === 'true' || env.useDotenv === true;

  console.log('=== WEBPACK CONFIG DEBUG ===');
  console.log('useDotenv:', useDotenv);
  console.log('Current process.env.API_URL:', process.env.API_URL);
  console.log('Current process.env.NODE_ENV:', process.env.NODE_ENV);

  // Load .env file manually if using dotenv mode
  if (useDotenv) {
    const dotenvPath = path.resolve(__dirname, '../.env');
    console.log('Loading .env from:', dotenvPath);

    try {
      require('dotenv').config({ path: dotenvPath });
      console.log('After dotenv load - API_URL:', process.env.API_URL);
      console.log('After dotenv load - NODE_ENV:', process.env.NODE_ENV);
    } catch (error) {
      console.error('Error loading .env file:', error);
    }
  }

  const rules = [
    {
      test: /\.(js|jsx|ts|tsx)$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          configFile: path.resolve(__dirname, './babel.config.js'),
        },
      },
    },
    {
      test: /\.css$/,
      exclude: /(node_modules)/,
      use: [
        { loader: 'style-loader' },
        { loader: 'css-loader' },
        {
          loader: 'postcss-loader',
          options: {
            postcssOptions: {
              config: path.resolve(__dirname, './postcss.config.js'),
            },
          },
        },
      ],
    },
    {
      test: /\.css$/,
      include: /node_modules/,
      use: ['style-loader', 'css-loader'],
    },
  ];

  const plugins = [
    new webpack.HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin({ template: './src/index.html' }),
  ];

  // Always use DefinePlugin to inject environment variables into the bundle
  const definePluginConfig = {
    'process.env.API_URL': JSON.stringify(
      process.env.API_URL || 'http://127.0.0.1:3123'
    ),
    'process.env.NODE_ENV': JSON.stringify(
      process.env.NODE_ENV || 'development'
    ),
    'process.env.SENTRY_DSN': JSON.stringify(process.env.SENTRY_DSN || ''),
    'process.env.DEMO_MODE': JSON.stringify(process.env.DEMO_MODE || 'false'),
    'process.env.PERFORMANCE_MONITORING': JSON.stringify(
      process.env.PERFORMANCE_MONITORING || 'true'
    ),
    'process.env.REACT_APP_API_URL': JSON.stringify(
      process.env.REACT_APP_API_URL ||
        process.env.API_URL ||
        'http://127.0.0.1:3123'
    ),
    'process.env.REACT_APP_SENTRY_DSN': JSON.stringify(
      process.env.REACT_APP_SENTRY_DSN || process.env.SENTRY_DSN || ''
    ),
    'process.env.REACT_APP_DEMO_MODE': JSON.stringify(
      process.env.REACT_APP_DEMO_MODE || process.env.DEMO_MODE || 'false'
    ),
    'process.env.REACT_APP_PERFORMANCE_MONITORING': JSON.stringify(
      process.env.REACT_APP_PERFORMANCE_MONITORING ||
        process.env.PERFORMANCE_MONITORING ||
        'true'
    ),
    // LoginRadius environment variables
    'process.env.REACT_APP_LR_CLIENT_ID': JSON.stringify(
      process.env.REACT_APP_LR_CLIENT_ID ||
        process.env.LOGINRADIUS_CLIENT_ID ||
        ''
    ),
    'process.env.REACT_APP_LR_CLIENT_SECRET': JSON.stringify(
      process.env.REACT_APP_LR_CLIENT_SECRET ||
        process.env.LOGINRADIUS_CLIENT_SECRET ||
        ''
    ),
    'process.env.REACT_APP_LR_APP_NAME': JSON.stringify(
      process.env.REACT_APP_LR_APP_NAME ||
        process.env.LOGINRADIUS_APP_NAME ||
        ''
    ),
    'process.env.REACT_APP_LR_ISSUER_URL': JSON.stringify(
      process.env.REACT_APP_LR_ISSUER_URL ||
        process.env.LOGINRADIUS_ISSUER_URL ||
        ''
    ),
    'process.env.REACT_APP_LR_NATIVE_REDIRECT_URI': JSON.stringify(
      process.env.REACT_APP_LR_NATIVE_REDIRECT_URI ||
        process.env.LOGINRADIUS_NATIVE_REDIRECT_URI ||
        ''
    ),
    'process.env.REACT_APP_LR_WEB_REDIRECT_URI': JSON.stringify(
      process.env.REACT_APP_LR_WEB_REDIRECT_URI ||
        process.env.LOGINRADIUS_WEB_REDIRECT_URI ||
        ''
    ),
    // Define the process object itself for browser environment
    process: JSON.stringify({
      env: {
        API_URL: process.env.API_URL || 'http://127.0.0.1:3123',
        NODE_ENV: process.env.NODE_ENV || 'development',
        SENTRY_DSN: process.env.SENTRY_DSN || '',
        DEMO_MODE: process.env.DEMO_MODE || 'false',
        PERFORMANCE_MONITORING: process.env.PERFORMANCE_MONITORING || 'true',
        REACT_APP_API_URL:
          process.env.REACT_APP_API_URL ||
          process.env.API_URL ||
          'http://127.0.0.1:3123',
        REACT_APP_SENTRY_DSN:
          process.env.REACT_APP_SENTRY_DSN || process.env.SENTRY_DSN || '',
        REACT_APP_DEMO_MODE:
          process.env.REACT_APP_DEMO_MODE || process.env.DEMO_MODE || 'false',
        REACT_APP_PERFORMANCE_MONITORING:
          process.env.REACT_APP_PERFORMANCE_MONITORING ||
          process.env.PERFORMANCE_MONITORING ||
          'true',
        // LoginRadius environment variables
        REACT_APP_LR_CLIENT_ID:
          process.env.REACT_APP_LR_CLIENT_ID ||
          process.env.LOGINRADIUS_CLIENT_ID ||
          '',
        REACT_APP_LR_CLIENT_SECRET:
          process.env.REACT_APP_LR_CLIENT_SECRET ||
          process.env.LOGINRADIUS_CLIENT_SECRET ||
          '',
        REACT_APP_LR_APP_NAME:
          process.env.REACT_APP_LR_APP_NAME ||
          process.env.LOGINRADIUS_APP_NAME ||
          '',
        REACT_APP_LR_ISSUER_URL:
          process.env.REACT_APP_LR_ISSUER_URL ||
          process.env.LOGINRADIUS_ISSUER_URL ||
          '',
        REACT_APP_LR_NATIVE_REDIRECT_URI:
          process.env.REACT_APP_LR_NATIVE_REDIRECT_URI ||
          process.env.LOGINRADIUS_NATIVE_REDIRECT_URI ||
          '',
        REACT_APP_LR_WEB_REDIRECT_URI:
          process.env.REACT_APP_LR_WEB_REDIRECT_URI ||
          process.env.LOGINRADIUS_WEB_REDIRECT_URI ||
          '',
      },
    }),
  };

  console.log('DefinePlugin config:', definePluginConfig);

  plugins.push(new webpack.DefinePlugin(definePluginConfig));

  if (!useDotenv) {
    console.log('[webpack] [PROD] Using environment variables directly');
  }

  console.log('=== END WEBPACK CONFIG DEBUG ===');

  return {
    entry: path.resolve(__dirname, '../src/index.tsx'),
    module: {
      rules,
    },
    resolve: {
      extensions: ['*', '.js', '.jsx', '.ts', '.tsx', '.css'],
    },
    output: {
      path: path.resolve(__dirname, '../dist'),
      filename: 'bundle.js',
      publicPath: '/',
    },
    plugins,
    devServer: {
      allowedHosts: 'all',
      static: path.resolve(__dirname, './public'),
      hot: true,
      port: PORT,
      historyApiFallback: true,
    },
  };
};
