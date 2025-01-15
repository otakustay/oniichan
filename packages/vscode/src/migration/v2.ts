import {deleteConfiguration} from './utils';

export default async function migrate() {
    deleteConfiguration('oniichan.model.apiStyle');
    deleteConfiguration('oniichan.model.baseUrl');
}
