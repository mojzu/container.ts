
// Conditionally import node modules.
export const buffer = (typeof window === "undefined") ? require("buffer") : null;
export const path = (typeof window === "undefined") ? require("path") : null;
export const fs = (typeof window === "undefined") ? require("fs") : null;

export class Node {

  /** Node buffer module. */
  public static get buffer(): typeof buffer {
    if (buffer == null) {
      throw new Error();
    }
    return buffer;
  }

  /** Node path module. */
  public static get path(): typeof path {
    if (path == null) {
      throw new Error();
    }
    return path;
  }

  /** Node file system module. */
  public static get fs(): typeof fs {
    if (fs == null) {
      throw new Error();
    }
    return fs;
  }

}

export default Node;
