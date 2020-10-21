import React, {SetStateAction} from 'react';
import {ApiNote} from '../../shared/type';

export const getStateFromURL = (search: string): State => {
    const pairs = search.slice(1).split('&');
    const query = pairs.find((param) => param.startsWith('q='))?.split('=')[1] ?? '';
    const note = pairs.find((param) => param.startsWith('n='))?.split('=')[1] ?? '';
    return {
        query: decodeURIComponent(query),
        note: note === '' ? undefined : decodeURIComponent(note),
    };
};

export type State = {query: string; note?: ApiNote | string; hash?: string};
export type NavigateNote = (note: string) => void;
export type SetState = React.Dispatch<SetStateAction<State>>;

export const noteId = (note: NonNullable<State['note']>): string => (typeof note === 'string' ? note : note.id);

export const useUrlChangableState = (): [State, SetState] => {
    const [state, setState] = React.useState<State>(() => getStateFromURL(window.location.search));
    React.useEffect(() => {
        const onChange = (): void => setState(getStateFromURL(window.location.search));
        window.addEventListener('popstate', onChange);
        return () => window.removeEventListener('popstate', onChange);
    }, [setState]);

    const setStateAndUrl = React.useCallback(
        (stateF: SetStateAction<State>) => {
            setState((old) => {
                const newState = typeof stateF === 'function' ? stateF(old) : stateF;
                if (old.note === newState.note && old.query === newState.query) {
                    return old;
                }
                const params = [`q=${encodeURIComponent(newState.query)}`];
                if (newState.note) {
                    params.push(`n=${encodeURIComponent(noteId(newState.note))}`);
                }

                const hash = newState.hash ? `#${newState.hash}` : '';
                const newSearch = `?${params.join('&')}`;
                if (newSearch !== window.location.search) {
                    window.history.pushState(newState, '', newSearch + hash);
                }
                return newState;
            });
        },
        [setState]
    );

    return [state, setStateAndUrl];
};
