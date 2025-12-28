import { useEffect, useState } from 'react';

interface TimeInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
}

export default function TimeInput({ label, value, onChange, required }: TimeInputProps) {
    const [hour, setHour] = useState('08');
    const [minute, setMinute] = useState('00');

    // Parse initial value
    useEffect(() => {
        if (value) {
            const [h, m] = value.split(':');
            if (h && h !== hour) setHour(h);
            if (m && m !== minute) setMinute(m);
        }
    }, [value, hour, minute]);

    const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newHour = e.target.value;
        setHour(newHour);
        onChange(`${newHour}:${minute}`);
    };

    const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newMinute = e.target.value;
        setMinute(newMinute);
        onChange(`${hour}:${newMinute}`);
    };

    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div className="flex gap-2">
                <div className="relative w-1/2">
                    <select
                        value={hour}
                        onChange={handleHourChange}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition appearance-none bg-white"
                        required={required}
                        title="Hora"
                    >
                        {hours.map(h => (
                            <option key={h} value={h}>{h}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500 text-xs">
                        Hrs
                    </div>
                </div>
                <span className="text-gray-400 self-center font-bold">:</span>
                <div className="relative w-1/2">
                    <select
                        value={minute}
                        onChange={handleMinuteChange}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition appearance-none bg-white"
                        required={required}
                        title="Minutos"
                    >
                        {minutes.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500 text-xs">
                        Min
                    </div>
                </div>
            </div>
        </div>
    );
}
