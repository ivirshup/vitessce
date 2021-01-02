const pkg = require('./package.json');
const { join } = require('path');
const React = require('react');
const ReactDOM = require('react-dom');

const resolve = require('@rollup/plugin-node-resolve');
const json = require('@rollup/plugin-json');
const scss = require('rollup-plugin-scss');
const svgr = require('@svgr/rollup').default;
const commonjs = require('@rollup/plugin-commonjs');
const { babel } = require('@rollup/plugin-babel');
const replace = require('@rollup/plugin-replace');
const html = require('@rollup/plugin-html');
const workerLoader = require('rollup-plugin-web-worker-loader');
const sucrase = require('@rollup/plugin-sucrase');
const globals = require('rollup-plugin-node-globals');
const builtins = require('rollup-plugin-node-builtins');
// Development server plugins.
const serve = require('rollup-plugin-serve');
const livereload = require('rollup-plugin-livereload');
const { htmlFromTemplate } = require('./rollup.utils');

// Constants for output files.
const DEMO_DIR = 'demo';
const DEMO_SRC_DIR = join(DEMO_DIR, 'src');
const DEMO_DIST_DIR = join(DEMO_DIR, 'dist');
const INPUT_JS = 'index.js';
const OUTPUT_JS = 'demo.js';
const OUTPUT_CSS = 'demo.css';

module.exports = {
    input: join(DEMO_SRC_DIR, INPUT_JS),
    output: {
        format: 'umd',
        // We want sourcemap files to be created for debugging purposes.
        // https://rollupjs.org/guide/en/#outputsourcemap
        sourcemap: true,
        dir: DEMO_DIST_DIR
    },
    plugins: [
        // Tell Rollup how to resolve packages in node_modules.
        // Reference: https://github.com/rollup/plugins/tree/master/packages/commonjs#using-with-rollupplugin-node-resolve
        resolve({
            browser: true,
            // Disable warnings like (!) Plugin node-resolve: preferring built-in module 'url' over local alternative.
            preferBuiltins: false,
        }),
        // Tell Rollup how to handle JSON imports.
        json(),
        // Tell Rollup how to handle CSS and SCSS imports.
        scss({
            output: join(DEMO_DIST_DIR, OUTPUT_CSS),
        }),
        // Tell Rollup how to handle SVG imports.
        svgr(),
        workerLoader({
            targetPlatform: 'browser',
            inline: true,
        }),
        // Need to convert CommonJS modules in node_modules to ES6.
        // Reference: https://github.com/rollup/plugins/tree/master/packages/node-resolve#using-with-rollupplugin-commonjs
        commonjs({
            // Using this RegEx rather than 'node_modules/**' is suggested, to enable symlinks.
            // Reference: https://github.com/rollup/plugins/tree/master/packages/commonjs#usage-with-symlinks
            include: /node_modules/,
            exclude: [
                'node_modules/zarr/dist/zarr.es6.js',
                // The following are to fix [!] Error: 'import' and 'export' may only appear at the top level.
                // Reference: https://github.com/rollup/plugins/issues/304
                'node_modules/probe.gl/dist/esm/lib/log.js',
                'node_modules/symbol-observable/es/index.js',
                'node_modules/is-observable/node_modules/symbol-observable/es/index.js',
                'src/components/heatmap/heatmap.worker.js'
            ],
            namedExports: {
                // Need to explicitly tell Rollup how to handle imports like `React, { useState }`
                // Reference: https://github.com/rollup/rollup-plugin-commonjs/issues/407#issuecomment-527837831
                // Reference: https://github.com/facebook/react/issues/11503
                'node_modules/react/index.js': Object.keys(React),
                'node_modules/react-dom/index.js': Object.keys(ReactDOM),
                'node_modules/probe.gl/env.js': ['global', 'isBrowser', 'getBrowser'],
                'node_modules/react-is/index.js': ['isFragment', 'ForwardRef', 'Memo'],
                'node_modules/@hms-dbmi/viv/dist/bundle.es.js': ['VivViewerLayer', 'StaticImageLayer', 'createZarrLoader', 'createOMETiffLoader'],
                'node_modules/json2csv/dist/json2csv.umd.js': ['parse'],
                'node_modules/turf-jsts/jsts.min.js': ['GeoJSONReader', 'GeoJSONWriter', 'BufferOp'],
                'node_modules/lz-string/libs/lz-string.js': ['compressToEncodedURIComponent', 'decompressFromEncodedURIComponent'],
                'node_modules/browserify-fs/index.js': ['open', 'read', 'close']
            }
        }),
        // Tell Rollup to compile our source files with Babel.
        // Note: This plugin respects Babel config files by default.
        // Reference: https://github.com/rollup/plugins/tree/master/packages/babel
        babel({
            // The 'runtime' option is recommended when bundling libraries.
            // Reference: https://github.com/rollup/plugins/tree/master/packages/babel#babelhelpers
            babelHelpers: 'runtime',
            // Only transpile our source code.
            // Reference: https://github.com/rollup/plugins/tree/master/packages/babel#extensions
            exclude: 'node_modules/**'
        }),
        globals(),
        builtins({ fs: true }),
        replace({
            // React uses process.env to determine whether a development or production environment.
            // Reference: https://github.com/rollup/rollup/issues/487#issuecomment-177596512
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
            // Reference: https://github.com/hubmapconsortium/vitessce-image-viewer/blob/v0.1.7/rollup.config.js
            "require('readable-stream/transform')": "require('stream').Transform",
            'require("readable-stream/transform")': 'require("stream").Transform',
            'readable-stream': 'stream'
        }),
        // We want Rollup to generate an HTML file for the demo.
        // Note: The default output filename is 'index.html'.
        html({
            // Our demo expects to find <div/> elements with particular IDs.
            // We need to use a custom templating function to override the default HTML output.
            // Reference: https://github.com/rollup/plugins/tree/master/packages/html#template
            template: htmlFromTemplate,
        }),
        serve({
            port: 3000,
            contentBase: DEMO_DIST_DIR
        }),
        livereload(DEMO_DIST_DIR)
    ],
    // We do not want to declare any externals.
    // The demo needs React and ReactDOM even though these are externals for the library output.
    external: []
};