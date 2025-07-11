import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';

/**
 * 获取当前文件所在的目录路径
 *
 * @param importMetaUrl - import.meta.url 的值
 * @returns 当前文件所在的目录的绝对路径
 */
export function currentDirectory(importMetaUrl: string): string {
    return dirname(currentFile(importMetaUrl));
}

/**
 * 获取当前文件的路径
 *
 * @param importMetaUrl - import.meta.url 的值
 * @returns 当前文件的绝对路径
 */
export function currentFile(importMetaUrl: string): string {
    return fileURLToPath(importMetaUrl);
}
