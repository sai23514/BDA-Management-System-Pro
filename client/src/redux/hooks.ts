import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

/** Typed `useDispatch` that knows about async thunks. */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

/** Typed `useSelector` bound to the app's `RootState`. */
export const useAppSelector = useSelector.withTypes<RootState>();
