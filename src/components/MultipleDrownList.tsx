import React from 'react';
import InputLabel from '@material-ui/core/InputLabel';
import { css, StyleSheet } from 'aphrodite/no-important';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemText from '@material-ui/core/ListItemText';
import Checkbox from '@material-ui/core/Checkbox';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 10 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};

export interface Props {
    items: string[],
    selectedItems: string[],
    label: string,
    onSelected: (items: string[]) => void
}
export default class MultipleDrownList extends React.Component<Props, { open: boolean }>{
    handleSelected = (event: React.ChangeEvent<HTMLSelectElement>) => {
        this.props.onSelected && this.props.onSelected(event.target.value as unknown as string[]);
    }
    render() {
        const labelFontSize = '0.85rem';
        const { items, selectedItems, label } = this.props;
        return (
            <FormControl className={css(styles.formControl, styles.select)}>
                <InputLabel htmlFor="select-multiple-chip" style={{ fontSize: labelFontSize }}>{label}</InputLabel>
                <Select
                    multiple
                    style={{ fontSize: labelFontSize }}
                    value={selectedItems}
                    onChange={this.handleSelected}
                    renderValue={(selected: any) => selected.join(', ')}
                    MenuProps={MenuProps}
                >
                    {items.map((item: string) => (
                        <MenuItem key={item} value={item}>
                            <Checkbox checked={selectedItems.indexOf(item) > -1} />
                            <ListItemText primary={item} />
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        );
    }
}
const styles = StyleSheet.create({
    formControl: {
        minWidth: 160,
        maxWidth: 160,
    },
    select: {
        marginLeft: 15
    },
});