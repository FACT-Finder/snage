import React from 'react';
// eslint-disable-next-line import/named
import {AutoSizer, CellMeasurer, CellMeasurerCache, List, ListRowProps, WindowScroller} from 'react-virtualized';
import {ApiNote} from '../../shared/type';
import 'react-virtualized/styles.css';

interface Props {
    entries: ApiNote[];
    rowRenderer: (note: ApiNote, style: React.CSSProperties) => React.ReactElement;
}

export class DynamicVirtualList extends React.Component<Props> {
    public componentDidUpdate(prevProps: Readonly<{}>, prevState: Readonly<{}>, snapshot?: any): void {
        this.cache.clearAll();
    }

    private readonly cache: CellMeasurerCache = new CellMeasurerCache({
        fixedWidth: true,
        defaultHeight: 100,
        // eslint-disable-next-line react/destructuring-assignment
        keyMapper: (idx) => this.props.entries[idx].id,
    });

    private readonly rowRenderer = (p: ListRowProps): React.ReactElement => {
        const {rowRenderer, entries} = this.props;
        return (
            <CellMeasurer cache={this.cache} columnIndex={0} key={p.key} rowIndex={p.index} parent={p.parent}>
                {rowRenderer(entries[p.index], p.style)}
            </CellMeasurer>
        );
    };

    public readonly render = (): React.ReactElement => {
        const {cache, props, rowRenderer} = this;
        return (
            <WindowScroller>
                {({height, isScrolling, onChildScroll, scrollTop}) => (
                    <AutoSizer>
                        {({width}) => (
                            <List
                                autoHeight={true}
                                width={width}
                                isScrolling={isScrolling}
                                scrollTop={scrollTop}
                                onScroll={onChildScroll}
                                deferredMeasurementCache={cache}
                                overscanRowCount={15}
                                rowHeight={cache.rowHeight}
                                rowRenderer={rowRenderer}
                                height={height}
                                rowCount={props.entries.length}
                            />
                        )}
                    </AutoSizer>
                )}
            </WindowScroller>
        );
    };
}
