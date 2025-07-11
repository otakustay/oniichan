import type {FixtureConfig} from '../interface.js';

const fixture: FixtureConfig = {
    name: 'go-fix-oom',
    source: {
        type: 'zip',
        path: 'go-fix-oom.zip',
    },
    query: {
        text:
            'yaml.Marshal过程中申请的内存远超目标yaml大小，经过pprof排查发现大多内存都是emitterc.go中的yaml_emitter_emit方法申请的，请分析项目代码找出问题所在，并在保证不影响原始功能的前提下对问题进行修复',
        references: [
            {type: 'file', file: 'goyaml.v2/emitterc.go'},
            {type: 'file', file: 'goyaml.v2/yamlh.go'},
            {type: 'file', file: 'goyaml.v2/encode.go'},
        ],
    },
    setup: [
        {type: 'shell', script: 'go mod tidy'},
    ],
    tests: [
        {
            name: 'memory-test',
            type: 'shell',
            minScore: 1,
            script: [
                'baseMem="350000000"',
                'allocMem=$(go test -bench=\'^\\QBenchmarkMarshal\\E$\' | grep BenchmarkMarshal-8 | awk \'{print $7}\')',
                'if [ "$allocMem" -lt "$baseMem" ]; then',
                '  echo "score: 1"',
                'else',
                '  echo "score: 0"',
                'fi',
            ],
            matches: [
                {text: 'score: 1', score: 1},
            ],
        },
    ],
};

export default fixture;
