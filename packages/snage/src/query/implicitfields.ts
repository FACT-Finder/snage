import {Field} from '../config/type';

export const SummaryField: Field = {
    name: 'summary',
    type: 'string',
    styleProvider: () => ({}),
};

export const ContentField: Field = {
    name: 'content',
    type: 'string',
    styleProvider: () => ({}),
};

export const ImplicitFields = [SummaryField, ContentField];
