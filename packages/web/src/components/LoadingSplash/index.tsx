import styled from '@emotion/styled';

const LoadingOutline = styled.div`
    --cell-size: 84px;
    --cell-spacing: 1px;
    --border-width: 1px;
    --cells: 4;
    --total-size: calc(var(--cells) * (var(--cell-size) + 2 * var(--cell-spacing)));
    display: flex;
    margin: 40px auto;
    flex-wrap: wrap;
    width: var(--total-size);
    height: var(--total-size);

    @keyframes ripple {
        0% {
            background-color: transparent;
        }
        30% {
            background-color: var(--cell-color);
        }
        60% {
            background-color: transparent;
        }
        100% {
            background-color: transparent;
        }
    }

    .cell {
        --cell-color: white;
        flex: 0 0 var(--cell-size);
        margin: var(--cell-spacing);
        background-color: transparent;
        box-sizing: border-box;
        border: var(--border-width) solid var(--cell-color);
        animation: 1.5s ripple ease infinite;
    }
    .cell.d-1 {
        animation-delay: 100ms;
    }
    .cell.d-2 {
        animation-delay: 200ms;
    }
    .cell.d-3 {
        animation-delay: 300ms;
    }
    .cell.d-4 {
        animation-delay: 400ms;
    }
    .cell.d-5 {
        animation-delay: 500ms;
    }
    .cell.d-6 {
        animation-delay: 600ms;
    }
    .cell:nth-child(1) {
        --cell-color: #d4aee0;
    }
    .cell:nth-child(2) {
        --cell-color: #8975b4;
    }
    .cell:nth-child(3) {
        --cell-color: #64518a;
    }
    .cell:nth-child(4) {
        --cell-color: #565190;
    }
    .cell:nth-child(5) {
        --cell-color: #44abac;
    }
    .cell:nth-child(6) {
        --cell-color: #2ca7d8;
    }
    .cell:nth-child(7) {
        --cell-color: #1482ce;
    }
    .cell:nth-child(8) {
        --cell-color: #05597c;
    }
    .cell:nth-child(9) {
        --cell-color: #b2dd57;
    }
    .cell:nth-child(10) {
        --cell-color: #57c443;
    }
    .cell:nth-child(11) {
        --cell-color: #05b853;
    }
    .cell:nth-child(12) {
        --cell-color: #19962e;
    }
    .cell:nth-child(13) {
        --cell-color: #fdc82e;
    }
    .cell:nth-child(14) {
        --cell-color: #fd9c2e;
    }
    .cell:nth-child(15) {
        --cell-color: #d5385a;
    }
    .cell:nth-child(16) {
        --cell-color: #911750;
    }
`;

export default function LoadingSplash() {
    return (
        <LoadingOutline>
            <div className="cell d-0"></div>
            <div className="cell d-1"></div>
            <div className="cell d-2"></div>
            <div className="cell d-3"></div>
            <div className="cell d-1"></div>
            <div className="cell d-2"></div>
            <div className="cell d-3"></div>
            <div className="cell d-4"></div>
            <div className="cell d-2"></div>
            <div className="cell d-3"></div>
            <div className="cell d-4"></div>
            <div className="cell d-5"></div>
            <div className="cell d-3"></div>
            <div className="cell d-4"></div>
            <div className="cell d-5"></div>
            <div className="cell d-6"></div>
        </LoadingOutline>
    );
}
