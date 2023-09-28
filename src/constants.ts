export namespace AuthFile {
  // 3 hours as milliseconds
  export const CACHE_TIME = 10_800_000;
}

export namespace MessageFile {
  // 3 hours as milliseconds
  export const CACHE_TIME = 10_800_000;
  // 25 MiB
  export const MAX_FILE_SIZE = 26_214_400;
}

export namespace CommonFile {
  // 2 MiB
  export const IMAGE_MAX_FILE_SIZE = 2_097_152;
  // 25 MiB
  export const MAX_FILE_SIZE = 26_214_400;
}
