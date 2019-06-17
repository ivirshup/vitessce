import Ajv from 'ajv';

import datasetSchema from '../schemas/dataset.schema.json';
import higlassViewConf from './higlass-viewconf.json';

// Used by the cypress tests: They route API requests to the fixtures instead.
export const urlPrefix = 'https://s3.amazonaws.com/vitessce-data/toslchan';

const linnarssonBase = {
  description: 'Spatial organization of the somatosensory cortex revealed by cyclic smFISH',
  layers: [
    'cells',
    'clusters',
    'factors',
    'genes',
    'images',
    'molecules',
    'neighborhoods',
  ].map(name => ({
    name,
    type: name.toUpperCase(),
    url: `${urlPrefix}/linnarsson.${name}.json`,
  })),
};


/* eslint-disable object-property-newline */
/* eslint-disable object-curly-newline */
const configs = {
  'linnarsson-2018': {
    ...linnarssonBase,
    name: 'Linnarsson (responsive layout)',
    public: true,
    responsiveLayout: {
      columns: {
        // First two columns are equal,
        // third column is constant;
        // Grid cell width stays roughly constant,
        // but more columns are available in a wider window.
        1400: [0, 6, 12, 14],
        1200: [0, 5, 10, 12],
        1000: [0, 4, 8, 10],
        800: [0, 3, 6, 8],
        600: [0, 2, 4, 8],
      },
      components: [
        { component: 'Description',
          props: {
            description: 'Linnarsson: Spatial organization of the somatosensory cortex revealed by cyclic smFISH',
          },
          x: 0, y: 0 },
        { component: 'StatusSubscriber',
          x: 0, y: 1 },
        { component: 'HoverableScatterplotSubscriber',
          props: { mapping: 't-SNE' },
          x: 0, y: 2, h: 2 },
        { component: 'HoverableSpatialSubscriber',
          props: {
            view: {
              zoom: -6.5,
              offset: [200, 200],
            },
          },
          x: 1, y: 0, h: 2 },
        { component: 'HoverableScatterplotSubscriber',
          props: { mapping: 'pca' },
          x: 1, y: 2, h: 2 },
        { component: 'FactorsSubscriber',
          x: 2, y: 0, h: 2 },
        { component: 'GenesSubscriber',
          x: 2, y: 2, h: 2 },
        { component: 'HeatmapSubscriber',
          x: 0, y: 4, w: 3 },
      ],
    },
  },
  'linnarsson-2018-static': {
    ...linnarssonBase,
    name: 'Linnarsson (static layout)',
    staticLayout: [
      { component: 'Description',
        props: {
          description: 'Linnarsson (static layout): Spatial organization of the somatosensory cortex revealed by cyclic smFISH',
        },
        x: 0, y: 0, w: 3, h: 1 },
      { component: 'ScatterplotSubscriber',
        props: { mapping: 't-SNE' },
        x: 0, y: 2, w: 3, h: 3 },
      { component: 'SpatialSubscriber',
        props: {
          view: {
            zoom: -6.5,
            offset: [200, 200],
          },
        },
        x: 3, y: 0, w: 6, h: 4 },
      { component: 'FactorsSubscriber',
        x: 9, y: 0, w: 3, h: 2 },
      { component: 'GenesSubscriber',
        x: 9, y: 2, w: 3, h: 2 },
      { component: 'HeatmapSubscriber',
        x: 0, y: 4, w: 12, h: 1 },
    ],
  },
  'higlass-component-demo': {
    description: '???',
    layers: [],
    name: 'HiGlass component demo',
    staticLayout: [
      { component: 'HiGlassComponent',
        props: {
          options: { bounded: true, editable: false },
          viewConfig: higlassViewConf,
        },
        x: 1, y: 0, w: 10, h: 1 },
    ],
  },
  'higlass-wrapped-component-demo': {
    description: '???',
    layers: [],
    name: 'HiGlass wrapped component demo',
    staticLayout: [
      { component: 'HiGlassWrappedComponent',
        props: {
          options: { bounded: true, editable: false },
          viewConfig: higlassViewConf,
        },
        x: 1, y: 0, w: 10, h: 1 },
    ],
  },
};
/* eslint-enable */

export function listConfigs() {
  return Object.entries(configs).filter(
    entry => entry[1].public,
  ).map(
    ([id, config]) => ({
      id,
      name: config.name,
      description: config.description,
    }),
  );
}

export function getConfig(id) {
  const datasetConfig = configs[id];
  const validate = new Ajv().compile(datasetSchema);
  const valid = validate(datasetConfig);
  if (!valid) {
    const failureReason = JSON.stringify(validate.errors, null, 2);
    console.warn('dataset validation failed', failureReason);
  }
  return datasetConfig;
}