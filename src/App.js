import React, { Component } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {sortBy} from 'lodash';

import './App.css';

const DEFAULT_QUERY = 'redux';
const DEFAULT_HPP = 100;

const PATH_BASE = 'https://hn.algolia.com/api/v1';
const PATH_SEARCH = '/search';
const PARAM_SEARCH = 'query=';
const PARAM_PAGE = 'page=';
const PARAM_HPP = 'hitsPerPage=';

export const SORTS = {
    NONE: list => list,
    TITLE: list => sortBy(list, 'title'),
    AUTHOR: list => sortBy(list, 'author'),
    COMMENTS: list => sortBy(list, 'num_comments').reverse(),
    POINTS: list => sortBy(list, 'points').reverse()
};

class App extends Component {
    constructor(props) {
        super(props);

        this._isMounted = false;

        this.state = {
            results: null,
            searchKey: '',
            searchTerm: DEFAULT_QUERY,
            error: null,
            isLoading: false
        };

        this.onDismiss = this.onDismiss.bind(this);
        this.onSearchChange = this.onSearchChange.bind(this);
        this.setSearchTopStories = this.setSearchTopStories.bind(this);
        this.fetchSearchTopStories = this.fetchSearchTopStories.bind(this);
        this.onSearchSubmit = this.onSearchSubmit.bind(this);
        this.needsToSearchTopStories = this.needsToSearchTopStories.bind(this);
    }

    needsToSearchTopStories(searchTerm) {
        return !this.state.results[searchTerm];
    }

    setSearchTopStories(result) {
        const {hits, page} = result;

        this.setState(prevState => {
            const {searchKey, results} = prevState;

            const oldHits = results && results[searchKey] ? results[searchKey].hits : [];
            const updatedHits = [...oldHits, ...hits];

            return {
                results: {
                    ...results,
                    [searchKey]: {hits: updatedHits, page}
                },
                isLoading: false
            };
        });
    }

    componentDidMount() {
        this._isMounted = true;

        const { searchTerm } = this.state;
        this.setState({searchKey: searchTerm});
        this.fetchSearchTopStories(searchTerm);
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    onSearchSubmit(event) {
        const {searchTerm} = this.state;
        this.setState({searchKey: searchTerm});

        if (this.needsToSearchTopStories(searchTerm)) {
            this.fetchSearchTopStories(searchTerm);
        }

        event.preventDefault();
    }

    fetchSearchTopStories(searchTerm, page=0) {
        this.setState({isLoading: true});

        axios(PATH_BASE.concat(PATH_SEARCH, '?', PARAM_SEARCH, searchTerm, '&', PARAM_PAGE, page, '&', PARAM_HPP, DEFAULT_HPP))
            .then(result => this._isMounted && this.setSearchTopStories(result.data))
            .catch(error => this._isMounted && this.setState({error}));
    }

    onDismiss(id) {
        const {searchKey, results} = this.state;
        const {hits, page} = results[searchKey];

        const isNotId = item => item.objectID !== id;
        const updatedHits = hits.filter(isNotId);

        this.setState({
            results: {
                ...results,
                [searchKey]: {hits: updatedHits, page}
            }
        });
    }

    onSearchChange(event) {
        this.setState({
            searchTerm: event.target.value
        });
    }

    render() {
        const {
            searchTerm,
            results,
            searchKey,
            error,
            isLoading
        } = this.state;
        const page = (results && results[searchKey] && results[searchKey].page) || 0;

        const list = (results && results[searchKey] && results[searchKey].hits) || [];
        return (
            <div className="page">
                <div className="interactions">
                    <Search
                        onChange={this.onSearchChange}
                        onSubmit={this.onSearchSubmit}
                        value={searchTerm}
                    >
                        Поиск
                    </Search>
                </div>
                {error
                    ? <div className="interactions">
                        <p>Something went wrong.</p>
                    </div>
                : results &&
                    <Table
                        list={list}
                        onDismiss={this.onDismiss}
                    />
                }
                <div className="interactions">
                    <ButtonWithLoading isLoading={isLoading} onClick={() => this.fetchSearchTopStories(searchKey, page + 1)}>
                        Больше историй
                    </ButtonWithLoading>
                </div>
            </div>
        );
    }
}

const Button = ({ onClick, className, children }) =>
    <button
        onClick={onClick}
        className={className}
        type="button"
    >
        {children}
    </button>;

Button.propTypes = {
    onClick: PropTypes.func.isRequired,
    className: PropTypes.string,
    children: PropTypes.node.isRequired
};

Button.defaultProps = {
    className: ''
};

class Search extends Component {

    componentDidMount() {
        if (this.input) {
            this.input.focus();
        }
    }

    render() {
        const { value, onChange, onSubmit, children } = this.props;

        return (
            <form onSubmit={onSubmit}>
                <input
                    type="text"
                    onChange={onChange}
                    value={value}
                    ref={(node) => {this.input = node;}}
                />
                <button type="submit">{children}</button>
            </form>
        );
    }
}

Search.propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    onSubmit: PropTypes.func,
    children: PropTypes.node.isRequired
};

Search.defaultProps = {
    value: ''
};

const Sort = ({
    sortKey,
    activeSortKey,
    onSort,
    children,
    isSortReverse,
    defaultDesc
}) => {
    const isActive = sortKey === activeSortKey;

    const sortClass = classNames(
        'button-inline',
        {'button-active': isActive}
    );

    const sorIconClass = classNames(
        'fa',
        {'fa-sort-asc': isSortReverse === defaultDesc},
        {'fa-sort-desc': isSortReverse !== defaultDesc}
    );

    return (
        <Button
            onClick={() => onSort(sortKey)}
            className={sortClass}
        >
            {isActive && <i className={sorIconClass}></i>}
            {children}
        </Button>
    );
}

Sort.propTypes = {
    sortKey: PropTypes.string.isRequired,
    activeSortKey: PropTypes.string.isRequired,
    onSort: PropTypes.func.isRequired,
    children: PropTypes.node,
    isSortReverse: PropTypes.bool.isRequired,
    defaultDesc: PropTypes.bool.isRequired
};

Sort.defaultProps = {
    activeSortKey: '',
    isSortReverse: false,
    defaultDesc: false
};

class Table extends Component {

    constructor(props) {
        super(props);

        this.state = {
            sortKey: 'NONE',
            isSortReverse: false
        };

        this.onSort = this.onSort.bind(this);
    }

    onSort(sortKey) {
        const isSortReverse = this.state.sortKey === sortKey && !this.state.isSortReverse;
        this.setState({sortKey, isSortReverse});
    }


    render() {
        const {
            list,
            onDismiss
        } = this.props;

        const {
            sortKey,
            isSortReverse
        } = this.state;

        const sortedList = SORTS[sortKey](list);
        const reverseSortedList = isSortReverse
            ? sortedList.reverse()
            : sortedList;

        return (
            <div className="table">
                <div className="table-header">
                    <span style={{width: '40%'}}>
                        <Sort
                            sortKey={'TITLE'}
                            onSort={this.onSort}
                            activeSortKey={sortKey}
                            isSortReverse={isSortReverse}
                        >
                            Заголовок
                        </Sort>
                    </span>
                    <span style={{width: '20%'}}>
                        <Sort
                            sortKey={'AUTHOR'}
                            onSort={this.onSort}
                            activeSortKey={sortKey}
                            isSortReverse={isSortReverse}
                        >
                            Автор
                        </Sort>
                    </span>
                    <span style={{width: '15%'}}>
                        <Sort
                            sortKey={'COMMENTS'}
                            onSort={this.onSort}
                            activeSortKey={sortKey}
                            isSortReverse={isSortReverse}
                            defaultDesc={true}
                        >
                            Комментарии
                        </Sort>
                    </span>
                    <span style={{width: '15%'}}>
                        <Sort
                            sortKey={'POINTS'}
                            onSort={this.onSort}
                            activeSortKey={sortKey}
                            isSortReverse={isSortReverse}
                            defaultDesc={true}
                        >
                            Очки
                        </Sort>
                    </span>
                    <span style={{width: '10%'}}>
                        Архив
                    </span>
                </div>
                {reverseSortedList.map((item) => {
                    return <div key={item.objectID} className="table-row">
                        <span style={{width: '40%'}}>
                            <a href={item.url}>{item.title}</a>
                        </span>
                        <span style={{width: '20%'}}>{item.author}</span>
                        <span style={{width: '15%'}}>{item.num_comments}</span>
                        <span style={{width: '15%'}}>{item.points}</span>
                        <span style={{width: '10%'}}>
                            <Button onClick={() => onDismiss(item.objectID)} className="button-inline">
                                Отбросить
                            </Button>
                        </span>
                    </div>;
                })}
            </div>
        );
    }
}

Table.propTypes = {
    list: PropTypes.arrayOf(
        PropTypes.shape({
            objectID: PropTypes.string.isRequired,
            author: PropTypes.string,
            url: PropTypes.string,
            num_comments: PropTypes.number,
            points: PropTypes.number
        })
    ).isRequired,
    onDismiss: PropTypes.func.isRequired
};


const Loading = () =>
    <i className="fa fa-spinner"></i>;

const withLoading = (Component) => ({isLoading, ...rest}) =>
    isLoading
        ? <Loading/>
        : <Component {...rest}/>;

const ButtonWithLoading = withLoading(Button);





export default App;

export {
    Button,
    Search,
    Table
};