import type {FixtureQueryConfig, FixtureConfig, ShellSetup} from './interface.js';
import asyncIteratorDeleteDebounce from './data/asyncIteratorDeleteDebounce.js';
import breezeForestAddDistribution from './data/breezeForestAddDistribution.js';
import mallAddWeChatPay from './data/mallAddWeChatPay.js';
import addEnumAndHandler from './data/addEnumAndHandler.js';
import goFixOom from './data/goFixOom.js';
import addApiPrefix from './data/addApiPrefix.js';

export type {FixtureQueryConfig, FixtureConfig, ShellSetup};

export const fixtures: FixtureConfig[] = [
    addEnumAndHandler,
    asyncIteratorDeleteDebounce,
    breezeForestAddDistribution,
    mallAddWeChatPay,
    goFixOom,
    addApiPrefix,
];
