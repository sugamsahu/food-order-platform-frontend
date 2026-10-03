import { screen } from '@testing-library/react';
import RequireAdmin from './RequireAdmin';
import { renderAt, signIn } from '../test/utils';

describe('RequireAdmin', () => {
  it('shows the staff screen to an administrator', () => {
    signIn('admin');
    renderAt(<RequireAdmin><p>staff screen</p></RequireAdmin>);
    expect(screen.getByText('staff screen')).toBeInTheDocument();
  });

  it('denies an operator with a clear message instead of the staff screen', () => {
    signIn('operator');
    renderAt(<RequireAdmin><p>staff screen</p></RequireAdmin>);
    expect(screen.queryByText('staff screen')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Not allowed');
  });
});
