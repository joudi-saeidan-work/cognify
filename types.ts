import { Card, List } from "@prisma/client";

/**
 * Represents a List with its associated Cards.
 * Useful when you want to fetch a list and include all its cards.
 */
export type ListWithCards = List & { cards: Card[] };
/**
 * Represents a Card with its associated List.
 * Useful when you need to fetch a card along with the list it belongs to.
 */
export type CardWithList = Card & { list: List };
