import type { Attribute, Common, Utils } from '@strapi/strapi';
import type Params from './index';

/**
 * Wildcard notation for populate
 *
 * To populate all the root level relations
 */
type WildcardNotation = '*';

type PopulatableKeys<TSchemaUID extends Common.UID.Schema> = Utils.Guard.Never<
  Attribute.GetPopulatableKeys<TSchemaUID>,
  string
>;

/**
 * Union of all possible string representation for populate
 *
 * @example
 * type A = 'image'; // ✅
 * type B = 'image,component'; // ✅
 * type c = '*'; // ✅
 * type D = 'populatableField'; // ✅
 * type E = '<random_string>'; // ❌
 */
type StringNotation<TSchemaUID extends Common.UID.Schema> =
  | WildcardNotation
  | PopulatableKeys<TSchemaUID>
  | `${string},${string}`
  | `${PopulatableKeys<TSchemaUID>}.${string}`;

/**
 * Array notation for populate
 *
 * @example
 * type A = ['image']; // ✅
 * type B = ['image', 'component']; // ✅
 * type C = ['populatableField']; // ✅
 * type D = ['<random_string>']; // ❌
 */
type ArrayNotation<TSchemaUID extends Common.UID.Schema> = StringNotation<TSchemaUID>[];

type ObjectNotation<TSchemaUID extends Common.UID.Schema> = {
  [key in PopulatableKeys<TSchemaUID>]?: Boolean | Params.For<Attribute.GetTarget<TSchemaUID, key>>;
};

export type Any<TSchemaUID extends Common.UID.Schema> =
  | StringNotation<TSchemaUID>
  | ArrayNotation<TSchemaUID>
  | ObjectNotation<TSchemaUID>;
