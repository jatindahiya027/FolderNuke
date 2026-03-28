export namespace main {
	
	export class DeleteResult {
	    path: string;
	    success: boolean;
	    error: string;
	    filesDeleted: number;
	    bytesFreed: number;
	
	    static createFrom(source: any = {}) {
	        return new DeleteResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.success = source["success"];
	        this.error = source["error"];
	        this.filesDeleted = source["filesDeleted"];
	        this.bytesFreed = source["bytesFreed"];
	    }
	}
	export class FolderEntry {
	    id: string;
	    path: string;
	    includeSubdirs: boolean;
	    useRecycleBin: boolean;
	
	    static createFrom(source: any = {}) {
	        return new FolderEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.path = source["path"];
	        this.includeSubdirs = source["includeSubdirs"];
	        this.useRecycleBin = source["useRecycleBin"];
	    }
	}
	export class HistoryEntry {
	    id: string;
	    path: string;
	    filesDeleted: number;
	    sizeFreed: string;
	    useRecycleBin: boolean;
	    timestamp: number;
	
	    static createFrom(source: any = {}) {
	        return new HistoryEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.path = source["path"];
	        this.filesDeleted = source["filesDeleted"];
	        this.sizeFreed = source["sizeFreed"];
	        this.useRecycleBin = source["useRecycleBin"];
	        this.timestamp = source["timestamp"];
	    }
	}

}

