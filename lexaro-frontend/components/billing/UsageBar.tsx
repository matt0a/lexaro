import React from "react";
import { fmtInt } from "../../lib/number";

type Props = {
    usedWords: number;
    monthlyWords: number;
};

export default function UsageBar({ usedWords, monthlyWords }: Props) {
    const pct = Math.min(100, Math.round((usedWords / Math.max(1, monthlyWords)) * 100));
    return (
        <div>
            <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
                <span>Usage</span>
                <span>{fmtInt(usedWords)} / {fmtInt(monthlyWords)} words</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
                <div className="h-2 rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}
