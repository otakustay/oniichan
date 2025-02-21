import {MessageThreadPersistData} from '@oniichan/shared/inbox';
// TODO: Use IoC to manage store
import {ThreadStore} from '../../inbox';

const debugMessageThreadFixtures: MessageThreadPersistData[] = [];

export const store = new ThreadStore(process.env.NODE_ENV === 'development' ? debugMessageThreadFixtures : []);
