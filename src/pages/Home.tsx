import React, { useEffect } from 'react';
import { useToggle } from 'react-use';
import {
  Box,
  Button,
  Center,
  Container,
  Heading,
  Spinner,
  Text,
} from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';
import { useHistory } from 'react-router-dom';

import { webservice } from '../services/moodle';
import useData from '../hooks/useData';

export default function Home() {
  const {
    url,
    user,
    courses,
    assignments,
    lastUpdate,
    dispatch,
  } = useData();
  const history = useHistory();
  const [loading, toggleLoading] = useToggle(true);

  useEffect(() => {
    if (!url) {
      history.push('/url');
      return;
    }

    if (!user) {
      history.push('/login');
      return;
    }

    async function addCourses() {
      const rawCourses = await webservice(
        url!,
        user!.token,
        'core_enrol_get_users_courses',
        {
          userid: user!.id,
        },
      ) as any[];

      dispatch({
        type: 'add_courses',
        courses: rawCourses.map(({ id, fullname }) => ({ id, name: fullname })),
      });
    }

    if (!courses) addCourses();
  }, [user]);

  useEffect(() => {
    const needUpdate = lastUpdate
      && new Date().getTime() / 1000 - Number(lastUpdate) <= 24 * 60 * 60;

    if (!courses) return;

    if (!needUpdate) {
      if (lastUpdate) {
        toggleLoading(false);
        return;
      }
    }

    async function updateAssignments() {
      const { events } = await webservice(
        url!,
        user!.token,
        'core_calendar_get_calendar_events',
        {
          events: {
            courseids: courses!.map((course) => course.id),
          },

          options: {
            siteevents: 0,
            timestart: Math.floor(new Date().getTime() / 1000),
          },
        },
      ) as { events: any[] };

      const newAssignments = events
        .filter((event) => event.modulename === 'assign')
        .map(({ id, courseid, name }) => ({
          id,
          courseid,
          name,
          done: false,
        }));

      dispatch({
        type: needUpdate ? 'update_assignments' : 'add_assignments',
        assignments: newAssignments,
        time: new Date().getTime() / 1000,
      });

      toggleLoading(false);
    }

    updateAssignments();
  }, [user, courses, lastUpdate]);

  function handleDone(id: number) {
    dispatch({ type: 'done_assignment', id });
  }

  if (loading) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }

  return (
    <Container>
      {
        assignments!.filter(({ done }) => !done).map(({ id, courseid, name }) => (
          <Box
            key={String(id)}
            maxW="sm"
            border="1px"
            borderColor="blackAlpha.700"
            borderRadius="10px"
            marginBottom="20px"
            padding="10px"
          >
            <Box display="flex" justifyContent="space-between" flexDirection="row">
              <Heading size="md">{name}</Heading>
              <Button colorScheme="green" onClick={() => handleDone(id)}>
                <CheckIcon />
              </Button>
            </Box>
            <Text>{courses!.find((course) => course.id === courseid)!.name}</Text>
          </Box>
        ))
      }
    </Container>
  );
}
