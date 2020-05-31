import {shell} from 'electron';
import React from 'react';
import styled from 'styled-components';
import * as Gopher from 'gopher';
import {Page, createTab, Resource} from 'core';
import Bag from 'utils/Bag';

import {
  IoIosFolder,
  IoIosDocument,
  IoIosImage,
  IoIosSearch,
  IoIosCloseCircle,
  IoIosArchive,
  IoIosGlobe,
  IoIosDesktop,
} from 'react-icons/io';


const ICON_MAP: Bag<React.FC<{size: number}>> = {
  '0': IoIosDocument,
  '1': IoIosFolder,
  '2': IoIosDesktop,
  '3': IoIosCloseCircle,
  '4': IoIosArchive,
  '5': IoIosArchive,
  '6': IoIosArchive,
  '7': IoIosSearch,
  '8': IoIosDesktop,
  '9': IoIosArchive,
  'd': IoIosDocument,
  'g': IoIosImage,
  'h': IoIosGlobe,
  'I': IoIosImage,
  'j': IoIosImage,
  'p': IoIosImage,
};

export default function GopherRenderer(p: {
  page: Page,
  historyIndex: number,
  resource: Resource,
  onVisit(url: string, at: number): void,
}) {
  const parsed = React.useMemo(() => {
    if (!p.resource) return [];
    return Gopher.parse(p.resource.data.toString());
  }, [p.resource?.timestamp]);

  return (
    <Container>
      {parsed.map((item, i) => (
        <GopherItem
          key={i}
          item={item}
          onVisit={p.onVisit}
          historyIndex={p.historyIndex}
        />
      ))}
    </Container>
  );
}

const Container = styled.div`
  flex: 1 0 auto;
  width: 664px;
  padding: 24px;
  scroll-snap-align: center;
  overflow: hidden scroll;
  font-family: "SF Mono", Menlo, Monaco, monospace;
  font-size: 12px;
  &:first-child, &:not(:last-child){ border-right: solid thin #ddd }
`;


export function GopherItem(p: {
  item: Gopher.Item,
  historyIndex: number,
  onVisit(url: string, at: number): void,
}) {
  const {item, historyIndex, onVisit} = p;
  const {type, label, url} = item;
  if (type == null || type === '.') return null;
  const Icon = ICON_MAP[type];

  const isLinked = !('i37'.includes(type));
  const visit = React.useCallback((e: React.MouseEvent) => {
    if (!url?.startsWith('gopher://')) return shell.openExternal(url!);
    if (e.metaKey) createTab('main', url!, e.shiftKey);
    else if (e.shiftKey) onVisit(url!, historyIndex);
    else onVisit(url!, historyIndex +1);
  }, [onVisit, url, historyIndex]);

  const isSearch = (type === '7');
  const search = React.useCallback((e) => {
    if (e.key !== 'Enter') return;
    const query = (e.target as HTMLInputElement).value;
    const searchUrl = `${url}\t${query}`;
    if (e.metaKey) createTab('main', searchUrl, e.shiftKey);
    else onVisit(searchUrl, historyIndex +1);
  }, [onVisit, historyIndex]);

  return <Line data-type={type} data-link={isLinked} onClick={isLinked? visit : undefined}>
    {Icon? <LineIcon><Icon size={20}/></LineIcon> : null}
    {isSearch ? (
      <LineSearchField placeholder={label} onKeyDown={search}/>
    ) : (
      <LineTitle>{label || ' '}</LineTitle>
    )}
  </Line>;
}

const Line = styled.div`
  position: relative;
  margin: 0 auto;
  width: 616px;
  padding: 12px 48px;
  border-radius: 8px;
  line-height: 1;

  &:not([data-link="true"]) {
    user-select: text;
  }

  &[data-link="true"] {
    cursor: pointer;
    color: #0366d6;
    &:hover {background: #EAF1F6}
  }

  &[data-type="i"] {
    padding: 0 48px;
  }

  &[data-type="i"] + &:not([data-type="i"]),
  &:not([data-type="i"]) + &[data-type="i"] {
    margin-top: 8px;
  }
`;

const LineIcon = styled.div`
  position: absolute;
  top: 9px;
  left: 16px;
  color: inherit;
`;

const LineTitle = styled.div`
  white-space: pre-wrap;
`;

const LineSearchField = styled.input`
  width: 70%;
  margin: -7px 0 -6px;
  padding: 6px 8px 5px;
  border: solid thin #ddd;
  border-radius: 3px;
  background: white;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, .1);
`;
