import { BaseModel } from '../base';

export class DirTreeItem extends BaseModel {
    path!: string;
    name!: string;
    size!: number;
    type!: string;
    is_dir!: boolean;
    children!: DirTreeItem[];
    download_url?: string;

    constructor(json?: any) {
        super(json);
        this.parseDirTreeItem(json || {});
    }

    parse(json: any): DirTreeItem {
        super.parse(json);
        this.parseDirTreeItem(json);
        return this;
    }

    private parseDirTreeItem(json: any) {
        this.__assignFields(json, ['path', 'name', 'type',  'is_dir', 'size', 'download_url']);
        this.__assignClassArrays(json, { children: DirTreeItem });
    }

}
