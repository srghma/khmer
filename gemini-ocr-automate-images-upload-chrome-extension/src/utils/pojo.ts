export function recursiveMapSetToArray(data: any): any {
  // Base case for non-object/non-iterable types
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  // Handle Map objects: convert to an array of [key, value] pairs
  if (data instanceof Map) {
    return Array.from(data.entries(), ([key, value]) => {
      // Recursively process both the key and the value
      return [recursiveMapSetToArray(key), recursiveMapSetToArray(value)];
    });
  }

  // Handle Set objects: convert to an array of values
  if (data instanceof Set) {
    return Array.from(data, (value) => {
      // Recursively process each value
      return recursiveMapSetToArray(value);
    });
  }

  // Handle standard Arrays: map over elements recursively
  if (Array.isArray(data)) {
    return data.map((item) => recursiveMapSetToArray(item));
  }

  // Handle plain Objects (Records): map over properties recursively
  if (data.constructor === Object) {
    const newObject: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        newObject[key] = recursiveMapSetToArray(data[key]) as any;
      }
    }
    return newObject;
  }

  // Return other object types (e.g., Date, RegExp) as is
  return data;
}