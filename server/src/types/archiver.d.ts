declare module "archiver" {
    import type { Transform } from "stream";
    import type { ZlibOptions } from "zlib";

    export interface EntryData {
        name: string;
    }

    export class Archiver extends Transform {
        append(source: NodeJS.ReadableStream | Buffer | string, data?: EntryData): this;
        finalize(): Promise<void>;
    }

    export class ZipArchive extends Archiver {
        constructor(options?: { zlib?: ZlibOptions });
    }

    export class TarArchive extends Archiver {
        constructor(options?: { gzip?: boolean; gzipOptions?: ZlibOptions });
    }

    export class JsonArchive extends Archiver {
        constructor(options?: Record<string, unknown>);
    }
}
