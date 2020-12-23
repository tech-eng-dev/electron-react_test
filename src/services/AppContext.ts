import { AppUser, Nullable } from "../models";

const context: Map<string, any> = new Map();

export const getUser = () => {
    return context.get('user') as Nullable<AppUser>;
}
export const setUser = (user: AppUser | null) => {
    context.set('user', user);
}