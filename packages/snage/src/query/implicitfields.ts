import {Field} from '../config/type';

export const SummaryField: Field = {
    name: 'summary',
    type: 'string',
};

export const ContentField: Field = {
    name: 'content',
    type: 'string',
};

export const ImplicitFields = [SummaryField, ContentField];
