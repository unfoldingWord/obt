import React, { useContext, useEffect } from 'react';

import { FormControl, Select, InputLabel, MenuItem } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { AppContext } from '../../context/AppContext';

import { languages } from '../../config/base';
import { mergeLanguageResources } from '../../helper';

import LanguageRoundedIcon from '@mui/icons-material/LanguageRounded';

export default function SelectLanguage({ label, style }) {
  const {
    state: { currentLanguage },
    actions: { setCurrentLanguage, setLanguageResources },
  } = useContext(AppContext);

  const { i18n, t } = useTranslation();

  const handleChange = (e) => {
    i18n.changeLanguage(e.target.value);
    setCurrentLanguage(e.target.value);
  };
  useEffect(() => {
    setLanguageResources((prev) => {
      return mergeLanguageResources(prev, [...prev, currentLanguage]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLanguage]);
  return (
    <FormControl sx={{ width: '100%', ...style }}>
      {label && (
        <InputLabel id="lang-select-label">
          <LanguageRoundedIcon fontSize="small" /> {label}
        </InputLabel>
      )}
      <Select
        labelid="lang-select-label"
        disableUnderline={true}
        sx={label ? { marginTop: '24px !important' } : {}}
        onChange={handleChange}
        value={currentLanguage}
      >
        {languages.map((el) => (
          <MenuItem key={el} sx={{ color: 'black' }} value={el}>
            {t(el)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
