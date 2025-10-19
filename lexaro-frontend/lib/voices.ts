import api from './api';

export type Voice = {
    name: string;
    gender: string;
    language: string;
    enginesSupported: string[];
};

export async function listVoices(): Promise<Voice[]> {
    const { data } = await api.get('/tts/voices');
    return data as Voice[];
}
