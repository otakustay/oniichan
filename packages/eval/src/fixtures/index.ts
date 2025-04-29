import type {FixtureQueryConfig, FixtureConfig, ShellSetup} from './interface';
import asyncIteratorDeleteDebounce from './data/asyncIteratorDeleteDebounce';
import breezeForestAddDistribution from './data/breezeForestAddDistribution';
import mallAddWeChatPay from './data/mallAddWeChatPay';

export type {FixtureQueryConfig, FixtureConfig, ShellSetup};

export const fixtures: FixtureConfig[] = [
    asyncIteratorDeleteDebounce,
    breezeForestAddDistribution,
    mallAddWeChatPay,
];
