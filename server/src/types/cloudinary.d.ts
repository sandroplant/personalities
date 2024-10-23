// server/src/types/cloudinary.d.ts

declare module 'cloudinary' {
    import { Stream } from 'stream';

    interface UploadApiResponse {
        public_id: string;
        version: number;
        signature: string;
        width: number;
        height: number;
        format: string;
        resource_type: string;
        created_at: string;
        tags: string[];
        bytes: number;
        type: string;
        etag: string;
        placeholder: boolean;
        url: string;
        secure_url: string;
        access_mode: string;
        original_filename: string;
        // Add any other fields you expect from the response
    }

    interface UploadApiOptions {
        public_id?: string;
        folder?: string;
        tags?: string[];
        transformation?: object;
        // Add other relevant options
    }

    export class v2 {
        upload_stream(
            options: UploadApiOptions,
            callback: (error: Error | null, result: UploadApiResponse) => void
        ): Stream;
        // Add other methods if needed
    }

    const cloudinary: {
        v2: v2;
        config(options: object): void;
        // Add other properties and methods as needed
    };

    export default cloudinary;
}
