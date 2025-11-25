export type Usage =
    | typeof StaticDrawUsage
    | typeof DynamicDrawUsage
    | typeof StreamDrawUsage
    | typeof StaticReadUsage
    | typeof DynamicReadUsage
    | typeof StreamReadUsage
    | typeof StaticCopyUsage
    | typeof DynamicCopyUsage
    | typeof StreamCopyUsage;

/**
 * The contents are intended to be specified once by the application, and used many
 * times as the source for drawing and image specification commands.
 */
export const StaticDrawUsage = 35044;

/**
 * The contents are intended to be respecified repeatedly by the application, and
 * used many times as the source for drawing and image specification commands.
 */
export const DynamicDrawUsage = 35048;

/**
 * The contents are intended to be specified once by the application, and used at most
 * a few times as the source for drawing and image specification commands.
 */
export const StreamDrawUsage = 35040;

/**
 * The contents are intended to be specified once by reading data from the 3D API, and queried
 * many times by the application.
 */
export const StaticReadUsage = 35045;

/**
 * The contents are intended to be respecified repeatedly by reading data from the 3D API, and queried
 * many times by the application.
 */
export const DynamicReadUsage = 35049;

/**
 * The contents are intended to be specified once by reading data from the 3D API, and queried at most
 * a few times by the application
 */
export const StreamReadUsage = 35041;

/**
 * The contents are intended to be specified once by reading data from the 3D API, and used many times as
 * the source for WebGL drawing and image specification commands.
 */
export const StaticCopyUsage = 35046;

/**
 * The contents are intended to be respecified repeatedly by reading data from the 3D API, and used many times
 * as the source for WebGL drawing and image specification commands.
 */
export const DynamicCopyUsage = 35050;

/**
 * The contents are intended to be specified once by reading data from the 3D API, and used at most a few times
 * as the source for WebGL drawing and image specification commands.
 */
export const StreamCopyUsage = 35042;

///////////////////////////////////////////////////////////////////////////////
// Data types

/**
 * An unsigned byte data type for textures.
 *
 * @constant
 */
export const UnsignedByteType = 1009;

/**
 * A byte data type for textures.
 *
 * @constant
 */
export const ByteType = 1010;

/**
 * A short data type for textures.
 *
 * @constant
 */
export const ShortType = 1011;

/**
 * An unsigned short data type for textures.
 *
 * @constant
 */
export const UnsignedShortType = 1012;

/**
 * An int data type for textures.
 *
 * @constant
 */
export const IntType = 1013;

/**
 * An unsigned int data type for textures.
 *
 * @constant
 */
export const UnsignedIntType = 1014;

/**
 * A float data type for textures.
 *
 * @constant
 */
export const FloatType = 1015;

/**
 * A half float data type for textures.
 *
 * @constant
 */
export const HalfFloatType = 1016;

/**
 * An unsigned short 4_4_4_4 (packed) data type for textures.
 *
 * @constant
 */
export const UnsignedShort4444Type = 1017;

/**
 * An unsigned short 5_5_5_1 (packed) data type for textures.
 *
 * @constant
 */
export const UnsignedShort5551Type = 1018;

/**
 * An unsigned int 24_8 data type for textures.
 *
 * @constant
 */
export const UnsignedInt248Type = 1020;

/**
 * An unsigned int 5_9_9_9 (packed) data type for textures.
 *
 * @constant
 */
export const UnsignedInt5999Type = 35902;

/**
 * An unsigned int 10_11_11 (packed) data type for textures.
 *
 * @constant
 */
export const UnsignedInt101111Type = 35899;