import type {FixtureQueryConfig, FixtureConfig, ShellSetup} from './interface';
import asyncIteratorDeleteDebounce from './data/asyncIteratorDeleteDebounce';
import breezeForestAddDistribution from './data/breezeForestAddDistribution';
import mallAddWeChatPay from './data/mallAddWeChatPay';
import addEnumAndHandler from './data/addEnumAndHandler';
import goFixOom from './data/goFixOom';

export type {FixtureQueryConfig, FixtureConfig, ShellSetup};

export const fixtures: FixtureConfig[] = [
    addEnumAndHandler,
    asyncIteratorDeleteDebounce,
    breezeForestAddDistribution,
    mallAddWeChatPay,
    goFixOom,
];
